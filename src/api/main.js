import { List, Map } from 'immutable';
import initFetch from 'iso-fetch-stream';

import configureRoutes       from './routes';
import initApiStore          from './store';
import initApiMethods        from './methods';
import { logError, logWarn } from '../lib/log';
import getQueryString        from '../lib/query_string';

import { getSchema, getIdFromModel, isSchema } from '../lib/schema';

const methodizeResource = ( fetch, props ) => ( memo, key ) => {

  const { url }      = props;
  const schema       = getSchema( props[ key ] );
  const options      = typeof props[ key ] === 'object' ? props[ key ] : {};
  const resourceType = schema.title;
  const resourcePath = `/${resourceType}`;

  // api-specific helpers for working with the state tree
  const apiStore = initApiStore( url, schema );

  // set up all routes
  const { getRouteConfig, isCustomRoute } = configureRoutes( key, resourcePath, options );

  // xhr + fetch state helpers
  const api = initApiMethods( fetch, apiStore, getRouteConfig );

  // placeholder to return while cacheable fetches are pending
  const getPlaceholder = ( path = null, dataType = List ) => {
    const empty = dataType === List ? [] : {};
    const placeholder = new dataType( empty );
    placeholder.$isPending = true;
    placeholder.$error = path ? apiStore.getError( path ) : null;
    placeholder.$clear = (() => undefined);
    placeholder.$reset = (() => Promise.reject( 'no data to reset' ));
    return placeholder;
  };

  // LIST

  const $list = ( params, options = {} ) => {
    const { route } = getRouteConfig( 'list', params ); 
    const path = route + ( params ? `?${getQueryString( params )}` : '' );
    const collection = apiStore.getCollection( path );
    if ( options.reset || !collection ) {
      api.fetchAll( path );
      return getPlaceholder( path );
    } else {
      const mapped = collection.map( addRestMethods );
      mapped.$clear = () => apiStore.clearCollection( path );
      mapped.$reset = () => {
        mapped.$clear();
        $list( params );
      };
      return mapped;
    }
  };

  // SEARCH

  const $search = params => {
    const { method, route, getData } = getRouteConfig( 'search', params );
    const fullRoute = method === 'get'
      ? route + `?${getQueryString( params )}`
      : route;
    if ( api.shouldFetch( fullRoute ) ) {
      const promise = method === 'get'
        ? api.get( fullRoute )
        : api[ method ]( fullRoute, params );

      return promise.then( data => {
        apiStore.setCollection( getData( data ), fullRoute );
        return data;
      });
    }
    // TODO: store promise as pending value so it can be used on repeat
    // calls
    return Promise.resolve( 'pending' );
  };

  $search.results = params => {
    const { route, method } = getRouteConfig( 'search', params );
    const fullRoute = method === 'get'
      ? route + `?${getQueryString( params )}`
      : route;
    const collection = apiStore.getCollection( fullRoute );
    if ( collection ) {
      const mapped = collection.map( addRestMethods );
      mapped.$clear = () => apiStore.clearCollection( fullRoute );
      mapped.$reset = () => {
        $clear();
        $search( params );
      };
      return mapped;
    } else {
      const placeholder = getPlaceholder( fullRoute );
      placeholder.$isPending = !!apiStore.getPending( fullRoute );
      return placeholder;
    }
  };


  // CREATE

  const optimisticCreate = ( data, options = {} ) => {
    if ( typeof options.optimistic === 'function' ) {
      const nextState = apiStore.getState().withMutations( map => options.optimistic( map, data ) );
      if ( nextState ) apiStore.setState( nextState );
      return api.createOne( data, options );
    } else {
      logWarn( `Optimistic creates must receive a function that updates the state with the optimistic data. The create will proceed pessimistically.`);
      return api.createOne( data, options );
    }
  };

  const $create = ( data, options = {} ) =>
    !options.optimistic
    ? api.createOne( data, options )
    : optimisticCreate( data, options );

  // GET

  const $get = ( id, options = {} ) => {
    const model = apiStore.getModel( id );
    if ( options.reset || !model || !model.get( '_fetched' ) ) {
      const { route } = getRouteConfig( 'get', id );
      api.fetchOne( id );
      const placeholder = getPlaceholder( route, Map );
      placeholder.$delete = $delete( id );
      placeholder.$update = $update( id );
      return placeholder;
    } else {
      return addRestMethods( model );
    }
  };

  // DELETE 

  const optimisticDelete = id => {
    const undoDelete = apiStore.deleteModel( id );
    if ( undoDelete.length ) {
      return api.deleteOne( id ).catch( err => {
        logError( `Failed to delete ${id}`, err );
        undoDelete.forEach( undo => undo() );
        return Promise.reject( err );
      });
    } else {
      return Promise.reject( new Error( 404 ) );
    }
  };

  const $delete = id => ( options = {} ) =>
    options.optimistic === false || !apiStore.getModel( id )
    ? api.deleteOne( id ).then(() => apiStore.deleteModel( id ) )
    : optimisticDelete( id );

  // UPDATE

  const optimisticUpdate = ( id, vals, options = {} ) => {
    const placeholder = typeof options.optimistic === 'function'
      ? options.optimistic({ id, ...vals })
      : vals;
    const undoUpdate = apiStore.updateModel( id, placeholder );
    if ( undoUpdate.length ) {
      return api.updateOne( id, vals )
        .then( response => {
          const { getData } = getRouteConfig( 'update', id, vals );
          apiStore.updateModel( id, getData( response ) );
          return response;
        })
        .catch( err => {
          logError( `Failed to update ${id} with vals`, vals, err );
          undoUpdate.forEach( undo => undo() );
          return Promise.reject( err );
        });
    } else {
      return Promise.reject( new Error( 404 ) );
    }
  };

  const $update = id => ( vals, options = {} ) =>
    options.optimistic === false || !apiStore.getModel( id )
      ? api.updateOne( id, vals ).then( response => {
        const { getData } = getRouteConfig( 'update', id, vals );
        apiStore.updateModel( id, getData( response ) );
        return response;
      })
      : optimisticUpdate( id, vals, options );

  // CACHE management for models

  const $clear = id => () => apiStore.setModel( id, null );
  const $reset = id => () => api.fetchOne( id );

  const addRestMethods = model => {
    const id      = getIdFromModel( model );
    model.$delete = $delete( id );
    model.$update = $update( id );
    model.$clear  = $clear( id );
    model.$reset  = $reset( id );
    return model;
  };

  // this is the function/object that gets returned and namespaced according to
  // the prop passed in by the user
  const main = params => $list( params );
  main.$list     = $list;
  main.$search   = $search;
  main.$create   = $create;
  main.$get      = $get;
  main.$clearAll = apiStore.clearAll;
  main.$reset    = api.fetchAll;

  main.subscribePath = apiStore.subscribePath;
  main.getState      = apiStore.getState;

  // hang standard api methods off of .api so devs can construct
  // non-standard paths
  main.api = [ 'delete', '$get', 'get', 'post', 'put', 'stream' ].reduce(( memo, method ) => ({
    ...memo,
    [method]: ( path, ...args ) => {
      const route = resourcePath + path;
      if ( method === '$get' ) {
        const cache = apiStore.getRequestsData( route );
        if ( cache ) {
          return List.isList( cache )
            ? apiStore.getCollection( route ).map( addRestMethods )
            : cache;
        } else {
          if ( api.shouldFetch( route ) ) {
            api.get( route, ...args ).then( data => {
              if ( Array.isArray( data ) ) {
                apiStore.setCollection( data, route );
              } else {
                apiStore.setRequestsData( route, data );
              }
              return data;
            });
          }
          return getPlaceholder( route );
        }
      } else {
        return api[ method ]( route, ...args );
      }
    }
  }), {});


  // add custom methods specified by user in routes config

  const fetchCacheable = config => {
    const cache  = apiStore.getRequestsData( config.route );
    if ( cache ) {
      cache.$clear = () => apiStore.setRequestsData( config.route, null );
      cache.$reset = () => {
        cache.$clear();
        api.custom( config );
      };
      return cache;
    } else {
      if ( api.shouldFetch( config.route ) ) api.custom( config );
      return getPlaceholder( config.route );
    }
  };

  const fetchNonCacheable = config =>
    api[ config.method ]( config.route, config.body )
      .then( response => config.getData( response ) );

  Object.keys( options.routes || {} ).forEach( key => {
    if ( isCustomRoute( key ) ) {
      main[ `\$${key}` ] = ( ...args ) => {
        const config = getRouteConfig( key, ...args );
        return config.usesCache
          ? fetchCacheable( config )
          : fetchNonCacheable( config );
      };
    }
  });

  memo[ key ] = main;

  return memo;
};

export default function createActions( props ) {

  const fetchOptions = props.credentials
    ? { credentials: props.credentials }
    : {};

  if ( props.auth || props.authorization ) {
    fetchOptions.headers = { Authorization: props.auth || props.authorization };
  }

  fetchOptions.makeUrl = path => props.url + path;

  const fetch = initFetch( fetchOptions );

  return Object.keys( props )
    .filter( isSchema( props ) )
    .reduce( methodizeResource( fetch, props ), {} );
}

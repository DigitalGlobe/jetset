import { List, Map } from 'immutable';
import initFetch from 'iso-fetch-stream';

import { getSchema, getIdFromModel, isSchema } from '../lib/schema';
import initApiStore from './store';
import { logError, logWarn } from '../lib/log';
import getQueryString from '../lib/query_string';
import config from '../config';


const methodDict = {
  create: 'post',
  list: 'get',
  get: 'get',
  update: 'put',
  delete: 'delete',
  search: 'get'
};

const logRoutes = ( routes, resource, ns ) => {
  if ( config.mode === 'development' ) {
    /* eslint-disable no-console */
    console.groupCollapsed( `Rendering Api component for %c${resource}`, 'color: green', `with these routes`);
    console.table(
      Object.keys( routes ).reduce(( memo, key ) => {
        const val = typeof routes[ key ] === 'function'
          ? routes[ key ]( 'id', {} )
          : routes[ key ];
        const def = typeof val === 'string'
          ? { method: methodDict[ key ], route: val }
          : val;
        const arg = key === 'get' ? 'id' : '';
        return Object.assign(memo, {[key]: Object.assign( def, {[`props.${ns}...`]: `\$${key}(${arg})` })});
      }, {})
    );
    console.groupEnd();
  }
};

function configureRoutes( key, rootPath, options = {} ) {

  const routes = Object.assign({
    create: () => ({ method: 'post', route: rootPath }),
    list:   () => ({ method: 'get', route: rootPath }),
    search: () => ({ method: 'get', route: rootPath }),
    get:    id => ({ method: 'get', route: `${rootPath}/${id}` }),
    update: id => ({ method: 'put', route: `${rootPath}/${id}` }),
    delete: id => ({ method: 'delete', route: `${rootPath}/${id}` })
  }, options );

  logRoutes( routes, rootPath, key );

  return {
    getRouteConfig: ( methodKey, ...args ) => {
      const config = routes[ methodKey ]( ...args );
      return typeof config === 'string'
        ? { method: methodDict[ methodKey ], route: config, getData: data => data }
        : {
          ...config,
          method:  ( config.method || methodDict[ methodKey ] || 'get' ).toLowerCase(),
          route:   config.route || routes.default || rootPath,
          getData: config.getData || options.getData || ( data => data )
        };
    }
  };
}

const methodizeResource = ( fetch, props ) => ( memo, key ) => {

  const { url }      = props;
  const schema       = getSchema( props[ key ] );
  const options      = typeof props[ key ] === 'object' ? props[ key ] : {};
  const resourceType = schema.title;
  const resourcePath = `/${resourceType}`;
  const apiStore     = initApiStore( url, schema );

  // TODO: use some more specific method from store's undo implementation
  const isUndo = () => apiStore._getState( '_reset' );
  const { getRouteConfig } = configureRoutes( key, resourcePath, options );


  const shouldFetch = path => !isUndo() && !apiStore.getPending( path ) && !apiStore.getError( path );

  const api = ['get', 'post', 'put', 'delete' ].reduce(( memo, method ) => ({
    ...memo,
    [method]: ( path, ...args ) => {
      apiStore.setPending( path, true );
      return fetch[ method ]( `${url}${path}`, ...args )
        .then(
          response => {
            apiStore.setPending( path, false );
            apiStore.setError( path, null, { quiet: true } );
            return response;
          },
          err => {
            apiStore.setPending( path, false );
            apiStore.setError( path, err );
            return Promise.reject( err );
          }
        );
    }
  }), {});


  /**
   * api calls
   */
  const fetchAll = path => {
    const { route: defaultRoute, method, getData } = getRouteConfig( 'list' );
    const route = path || defaultRoute;
    if ( shouldFetch( route ) ) {
      return api[ method ]( route ).then( response => {
        const data = getData( response );
        apiStore.setCollection( data, route );
        return response;
      });
    } else {
      // TODO: store pendingpromise to return here?
    }
  };

  const fetchOne = id => {
    const { route, method, getData } = getRouteConfig( 'get', id );
    if ( shouldFetch( route ) ) {
      return api[ method ]( route ).then( response => {
        const data = getData( response );
        apiStore.setModel( getIdFromModel( data ), { ...data, _fetched: true });
        return response;
      });
    } else {
      // TODO: store pendingpromise to return here?
    }
  };

  const createOne = ( data, options = {} ) => {
    const { route, method } = getRouteConfig( 'create', data );
    return api[ method ]( route, data ).then( data => {
      if ( options.refetch !== false ) {
        fetchAll();
      } else {
        apiStore.updateCollection( data );
      }
      return data;
    });
  };

  const updateOne = ( id, data ) => {
    const { route, method } = getRouteConfig( 'update', id, data );
    return api[ method ]( route, data );
  };

  const deleteOne = id => {
    const { route, method } = getRouteConfig( 'delete', id );
    return api[ method ]( route );
  };


  /**/

  const $clear = id => () => apiStore.setModel( id, null );
  const $reset = id => () => fetchOne( id );

  const optimisticDelete = id => {
    const undoDelete = apiStore.deleteModel( id );
    if ( undoDelete.length ) {
      return deleteOne( id ).catch( err => {
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
    ? deleteOne( id ).then(() => apiStore.deleteModel( id ) )
    : optimisticDelete( id );

  const optimisticUpdate = ( id, vals, options = {} ) => {
    const placeholder = typeof options.optimistic === 'function'
      ? options.optimistic({ id, ...vals })
      : vals;
    const undoUpdate = apiStore.updateModel( id, placeholder );
    if ( undoUpdate.length ) {
      return updateOne( id, vals ).catch( err => {
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
    ? updateOne( id, vals ).then( response => {
      const { getData } = getRouteConfig( 'update', id, vals );
      apiStore.updateModel( id, getData( response ) );
      return response;
    })
    : optimisticUpdate( id, vals, options );

  const getPlaceholder = ( path = null, dataType = List ) => {
    const placeholder = dataType();
    placeholder.$isPending = true;
    placeholder.$error = path ? apiStore.getError( path ) : null;
    placeholder.$clear = (() => undefined);
    placeholder.$reset = (() => Promise.reject( 'no data to reset' ));
    return placeholder;
  };

  const addRestMethods = model => {
    const id      = getIdFromModel( model );
    model.$delete = $delete( id );
    model.$update = $update( id );
    model.$clear  = $clear( id );
    model.$reset  = $reset( id );
    return model;
  };

  const $list = ( params, options = {} ) => {
    const { route } = getRouteConfig( 'list', params ); 
    const path = route + ( params ? `?${getQueryString( params )}` : '' );
    const collection = apiStore.getCollection( path );
    if ( options.reset || !collection ) {
      fetchAll( path );
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

  const main = params => $list( params );

  main.$list = $list;

  main.$get = ( id, options = {} ) => {
    const model = apiStore.getModel( id );
    if ( options.reset || !model || !model.get( '_fetched' ) ) {
      const { route } = getRouteConfig( 'get', id );
      fetchOne( id );
      const placeholder = getPlaceholder( route, Map );
      placeholder.$delete = $delete( id );
      placeholder.$update = $update( id );
      return placeholder;
    } else {
      return addRestMethods( model );
    }
  };

  main.$clearAll = apiStore.clearAll;
  main.$reset = fetchAll;

  const optimisticCreate = ( data, options = {} ) => {
    if ( typeof options.optimistic === 'function' ) {
      const nextState = apiStore.getState().withMutations( map => options.optimistic( map, data ) );
      if ( nextState ) apiStore.setState( nextState );
      return createOne( data, options );
    } else {
      logWarn( `Optimistic creates must receive a function that updates the state with the optimistic data. The create will proceed pessimistically.`);
      return createOne( data, options );
    }
  };

  main.$create = ( data, options = {} ) =>
    !options.optimistic
    ? createOne( data, options )
    : optimisticCreate( data, options );

  main.$search = params => {
    const { method, route } = getRouteConfig( 'search', params );
    const fullRoute = method === 'get'
      ? route + `?${getQueryString( params )}`
      : route;
    if ( shouldFetch( fullRoute ) ) {
      const promise = method === 'get'
        ? api.get( fullRoute )
        : api[ method ]( fullRoute, params );

      return promise.then( data => {
        apiStore.setCollection( data, fullRoute );
        return data;
      });
    }
    // TODO: store promise as pending value so it can be used on repeat
    // calls
    return Promise.resolve( 'pending' );
  };

  main.$search.results = params => {
    const { route, method } = getRouteConfig( 'search', params );
    const fullRoute = method === 'get'
      ? route + `?${getQueryString( params )}`
      : route;
    const collection = apiStore.getCollection( fullRoute );
    if ( collection ) {
      const mapped = collection.map( addRestMethods );
      mapped.$clear = () => apiStore.clearCollection( fullRoute );
      mapped.$reset = () => {
        main.$clear();
        main.$search( params );
      };
      return mapped;
    } else {
      const placeholder = getPlaceholder( fullRoute );
      placeholder.$isPending = !!apiStore.getPending( fullRoute );
      return placeholder;
    }
  };

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
          if ( shouldFetch( route ) ) {
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

  const fetchCustom = config =>
    api[ config.method ]( config.route, config.body )
    .then( response => {
      const data = config.getData( response );
      apiStore.setRequestsData( config.route, data );
      return response;
    });

  Object.keys( options.routes || {} ).forEach( key => {
    if ( !methodDict[ key ] ) {
      main[ `\$${key}` ] = ( ...args ) => {
        const config = getRouteConfig( key, ...args );
        if ( config.usesCache ) {
          const cache  = apiStore.getRequestsData( config.route );
          if ( cache ) {
            cache.$clear = () => apiStore.setRequestsData( config.route, null );
            cache.$reset = () => {
              cache.$clear();
              fetchCustom( config );
            };
            return cache;
          } else {
            if ( shouldFetch( config.route ) ) fetchCustom( config );
            return getPlaceholder( config.route );
          }
        } else { 
          return api[ config.method ]( config.route, config.body )
            .then( response => config.getData( response ) );
        }
      };
    }
  });

  main._schema       = schema;
  main._resourceType = resourceType;
  main.getState      = apiStore.getState;

  memo[ key ] = main;
  if ( typeof window !== 'undefined' ) {
    window.jetset = window.jetset || {};
    window.jetset[ key ] = main;
  }

  return memo;
};

export default function createActions( props ) {

  const fetchOptions = props.credentials
    ? { credentials: props.credentials }
    : {};

  if ( props.auth || props.authorization ) {
    fetchOptions.headers = { Authorization: props.auth || props.authorization };
  }

  const fetch = initFetch( fetchOptions );

  return Object.keys( props )
    .filter( isSchema( props ) )
    .reduce( methodizeResource( fetch, props ), {} );
}

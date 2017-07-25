import { List, Map } from 'immutable';
import initFetch from 'iso-fetch-stream';

import configureRoutes       from './routes';
import initApiStore          from './store';
import initApiMethods        from './methods';
import { logError, logWarn } from '../lib/log';
import getQueryString        from '../lib/query_string';
import clone                 from '../lib/make_empty';

import { getSchema, getIdFromModel, isSchema } from '../lib/schema';

const propsList = [
  'url',
  'credentials',
  'authorization',
  'onSuccess',
  'onError',
  'immutable'
];

const actionsCache = {};

const methodizeResource = ( fetch, props ) => ( memo, key ) => {

  const serializedKey = [ ...propsList, key ].reduce(( memo, key ) => memo + `&${key}=${String( props[key] )}`, '');
  if ( actionsCache[ serializedKey ] ) {
    memo[ key ] = actionsCache[ serializedKey ];
  } else {
    const { url }      = props;
    const schema       = getSchema( props[ key ] );
    const options      = typeof props[ key ] === 'object' ? props[ key ] : {};
    const useImmutable = props.immutable || options.immutable;
    const resourceType = schema.title;
    const resourcePath = `/${resourceType}`;

    // initial the main export for use in other modules
    const main = {};

    // api-specific helpers for working with the state tree
    const apiStore = initApiStore( url, schema );

    // set up all routes
    const { getRouteConfig, isCustomRoute } = configureRoutes( key, resourcePath, options, main );

    // xhr + fetch state helpers
    const api = initApiMethods( fetch, apiStore, getRouteConfig );

    // placeholder to return while cacheable fetches are pending
    const getPlaceholder = ( promise, path = null, dataType = List ) => ({
      promise,
      data:      useImmutable ? clone( dataType ) : dataType().toJS(),
      isPending: true,
      error:     path ? apiStore.getError( path ) : null,
      clear:     (() => undefined),
      reset:     (() => Promise.reject( 'no data to reset' ))
    });

    const deliver = structure =>
      !useImmutable && typeof structure === 'object' && structure.toJS
        ? structure.toJS()
        : structure;

    // LIST

    const $list = ( params, options = {} ) => {
      const { route } = getRouteConfig( 'list', params );
      const path = route + ( params ? `?${getQueryString( params )}` : '' );
      const collection = apiStore.getCollection( path );
      if ( options.reset || !collection ) {
        const promise = api.fetchAll( path );
        return getPlaceholder( promise, path );
      } else {
        const clear = () => apiStore.clearCollection( path );
        return {
          data: deliver( collection ).map( addRestMethods ),
          promise: apiStore.getRequestsPromise( route ),
          clear,
          reset: () => {
            clear();
            $list( params );
          }
        };
      }
    };

    // SEARCH

    const $search = params => {
      const { method, route, onSuccess, onError } = getRouteConfig( 'search', params );
      const fullRoute = method === 'get'
        ? route + `?${getQueryString( params )}`
        : route;
      if ( api.shouldFetch( fullRoute ) ) {
        const promise = method === 'get'
          ? api.get( fullRoute )
          : api[ method ]( fullRoute, params );

        return promise
          .then( onSuccess )
          .then( data => {
            apiStore.setCollection( data, fullRoute );
            return data;
          })
          .catch( onError );
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
      const promise = apiStore.getRequestsPromise( fullRoute );
      if ( collection ) {
        const clear = () => apiStore.clearCollection( fullRoute );
        return {
          data: deliver( collection ).map( addRestMethods ),
          promise,
          clear,
          reset: () => {
            clear();
            $search( params );
          }
        };
      } else {
        const placeholder = getPlaceholder( promise, fullRoute );
        placeholder.isPending = !!apiStore.getPending( fullRoute );
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
      const { route } = getRouteConfig( 'get', id );
      if ( options.reset || !model || !model.get( '_fetched' ) ) {
        const promise = api.fetchOne( id );
        const placeholder = getPlaceholder( promise, route, Map );
        placeholder.delete = $delete( id );
        placeholder.update = $update( id );
        return placeholder;
      } else {
        return {
          ...addRestMethods( deliver( model ) ),
          promise: apiStore.getRequestsPromise( route )
        };
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
        ? api.deleteOne( id ).then( response => {
          apiStore.deleteModel( id );
          return response;
        })
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
            apiStore.updateModel( id, response );
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
          apiStore.updateModel( id, response );
          return response;
        })
        : optimisticUpdate( id, vals, options );

    // CACHE management for models

    const $clear = id => () => apiStore.setModel( id, null );
    const $reset = id => () => api.fetchOne( id );

    const addRestMethods = model => {
      if ( typeof model === 'object' ) {
        const id = getIdFromModel( model );
        return {
          data:   model,
          delete: $delete( id ),
          update: $update( id ),
          clear:  $clear( id ),
          reset:  $reset( id )
        };
      }
      return model;
    };

    main.list     = $list;
    main.search   = $search;
    main.create   = $create;
    main.get      = $get;
    main.clearAll = apiStore.clearAll;
    main.reset    = api.fetchAll;

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
          let promise = apiStore.getRequestsPromise( route );
          if ( cache ) {
            return {
              promise,
              data: List.isList( cache )
                ? deliver( apiStore.getCollection( route ) ).map( addRestMethods )
                : deliver( cache )
            };
          } else {
            if ( api.shouldFetch( route ) ) {
              promise = api.get( route, ...args ).then( data => {
                if ( Array.isArray( data ) ) {
                  apiStore.setCollection( data, route );
                } else {
                  apiStore.setRequestsData( route, data );
                }
                return data;
              });
            }
            return getPlaceholder( promise, route );
          }
        } else {
          return api[ method ]( route, ...args );
        }
      }
    }), {});


    // add custom methods specified by user in routes config

    const fetchCacheable = config => {
      const cache = deliver( apiStore.getRequestsData( config.route ) );
      let promise = apiStore.getRequestsPromise( config.route );
      if ( cache ) {
        const clear = () => apiStore.setRequestsData( config.route, null );
        return {
          clear,
          data: cache,
          promise,
          reset: () => {
            cache.$clear();
            api.custom( config );
          }
        };
      } else {
        if ( api.shouldFetch( config.route ) ) {
          promise = api.custom( config );
        }
        return getPlaceholder( promise, config.route );
      }
    };

    const fetchNonCacheable = config =>
      api[ config.method ]( config.route, config.body )
        .then( config.onSuccess, config.onError );

    Object.keys( options.routes || {} ).forEach( key => {
      if ( isCustomRoute( key ) ) {
        main[ `${key}` ] = ( ...args ) => {
          const config = getRouteConfig( key, ...args );
          return config.usesCache
            ? fetchCacheable( config )
            : fetchNonCacheable( config );
        };
      }
    });

    actionsCache[ serializedKey ] = memo[ key ] = main;
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

  fetchOptions.makeUrl = path => props.url + path;

  const fetch = initFetch( fetchOptions );

  return Object.keys( props )
    .filter( isSchema( props ) )
    .reduce( methodizeResource( fetch, props ), {} );
}

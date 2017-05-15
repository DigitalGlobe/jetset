import { List, Map } from 'immutable';
import initFetch from 'iso-fetch-stream';

import { isSchema, getIdField } from '../lib/schema';
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
        const val = routes[ key ]( 'id', {} );
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

export default function createActions({ url, ...props }) {

  const fetchOptions = props.credentials ? { credentials: props.credentials } : {};
  if ( props.auth || props.authorization ) fetchOptions.headers = { Authorization: props.auth || props.authorization };
  const fetch = initFetch( fetchOptions );

  return Object.keys( props ).reduce(( memo, key ) => {

    if ( isSchema( props[ key ] ) ) {

      const schema       = props[ key ].schema || props[ key ];
      const getData      = props[ key ].getData || ( data => data );
      const idField      = getIdField( schema );
      const resourceType = schema.title;
      const resourcePath = `/${resourceType}`;
      const apiStore     = initApiStore( url, schema );

      // TODO: use some more specific method from store's undo implementation
      const isUndo = () => apiStore._getState( '_reset' );

      const routes = Object.assign({
        create: () => ({ method: 'post', route: resourcePath }),
        list:   () => ({ method: 'get', route: resourcePath }),
        search: () => ({ method: 'get', route: resourcePath }),
        get:    id => ({ method: 'get', route: `${resourcePath}/${id}` }),
        update: id => ({ method: 'put', route: `${resourcePath}/${id}` }),
        delete: id => ({ method: 'delete', route: `${resourcePath}/${id}` })
      }, props[ key ].routes || {} );

      logRoutes( routes, resourceType, key );

      const shouldFetch = path => !isUndo() && !apiStore.getPending( path ) && !apiStore.getError( path );

      const api = ['get', 'post', 'put', 'delete' ].reduce(( memo, method ) => ({
        ...memo,
        [method]: ( path, ...args ) => {
          apiStore.setPending( path, true );
          return fetch[ method ]( `${url}${path}`, ...args )
            .then(
              response => {
                const data = getData( response );
                apiStore.setPending( path, false );
                apiStore.setError( path, null, { quiet: true } );
                return data;
              },
              err => {
                apiStore.setPending( path, false );
                apiStore.setError( path, err );
                return Promise.reject( err );
              }
            );
        }
      }), {});

      const getRouteConfig = ( config, defaultMethod = 'get' ) =>
        typeof config === 'string'
          ? { method: defaultMethod, route: config }
          : { method: config.method.toLowerCase(), route: config.route };

      /**
       * api calls
       */
      const fetchAll = path => {
        const { route: defaultRoute, method } = getRouteConfig( routes.list() );
        const route = path || defaultRoute;
        if ( shouldFetch( route ) ) {
          api[ method ]( route ).then( data => apiStore.setCollection( data, route ) );
        }
      };

      const fetchOne = id => {
        const { route, method } = getRouteConfig( routes.get( id ) );
        if ( shouldFetch( route ) ) {
          api[ method ]( route ).then( data => apiStore.setModel( data[ idField ], { ...data, _fetched: true }));
        }
      };

      const createOne = data => {
        const { route, method } = getRouteConfig( routes.create( data ), 'post' );
        return api[ method ]( route, data ).then( data => {
          fetchAll();
          return data;
        });
      };

      const updateOne = ( id, data ) => {
        const { route, method } = getRouteConfig( routes.update( id, data ), 'put' );
        return api[ method ]( route, data );
      };

      const deleteOne = id => {
        const { route, method } = getRouteConfig( routes.delete( id ), 'delete' );
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
          ? updateOne( id, vals ).then( data => apiStore.updateModel( id, data ) )
          : optimisticUpdate( id, vals, options );

      const getPlaceholder = ( path = null, dataType = List ) => {
        const placeholder = dataType();
        placeholder.$isPending = true;
        placeholder.$error = path ? apiStore.getError( path ) : null;
        return placeholder;
      };

      const addRestMethods = model => {
        const id = model.get( idField );
        model.$delete = $delete( id );
        model.$update = $update( id );
        model.$clear  = $clear( id );
        model.$reset  = $reset( id );
        return model;
      };

      const $list = params => {
        const { route } = getRouteConfig( routes.list( params ) ); 
        const path = route + ( params ? `?${getQueryString( params )}` : '' );
        const collection = apiStore.getCollection( path );
        if ( !collection ) {
          fetchAll( path );
          return getPlaceholder( path );
        } else {
          return collection.map( addRestMethods );
        }
      };

      const main = params => $list( params );

      main.$list = $list;

      main.$get = id => {
        const model = apiStore.getModel( id );
        if ( !model || !model.get( '_fetched' ) ) {
          const path = routes.get( id );
          fetchOne( id );
          const placeholder = getPlaceholder( path, Map );
          placeholder.$delete = $delete( id );
          placeholder.$update = $update( id );
          return placeholder;
        } else {
          return addRestMethods( model );
        }
      };

      // remove the cache for the resource collection
      main.$clear = () => apiStore.clearCollection();
      main.$clearAll = apiStore.clearAll;
      main.$reset = fetchAll;


      const optimisticCreate = ( data, options = {} ) => {
        if ( typeof options.optimistic === 'function' ) {
          const nextState = apiStore.getState().withMutations( map => options.optimistic( map, data ) );
          if ( nextState ) apiStore.setState( nextState );
          return createOne( data );
        } else {
          logWarn( `Optimistic creates must receive a function that updates the state with the optimistic data. The create will proceed pessimistically.`);
          return createOne( data );
        }
      };

      main.$create = ( data, options = {} ) =>
        !options.optimistic
          ? createOne( data )
          : optimisticCreate( data, options );

      main.$search = params => {
        const { method, route } = getRouteConfig( routes.search( params ) );
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
        const { route, method } = getRouteConfig( routes.search( params ) );
        const fullRoute = method === 'get'
          ? route + `?${getQueryString( params )}`
          : route;
        const resultsCached = apiStore.getCollection( fullRoute );
        if ( resultsCached ) {
          return addRestMethods( resultsCached );
        } else {
          const placeholder = List();
          placeholder.$isPending = !!apiStore.getPending( fullRoute );
          placeholder.$error = apiStore.getError( fullRoute );
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

      main._schema       = schema;
      main._resourceType = resourceType;
      main.getState      = apiStore.getState;

      memo[ key ] = main;
      if ( typeof window !== 'undefined' ) {
        window.jetset = window.jetset || {};
        window.jetset[ key ] = main;
      }
    }
    return memo;
  }, {} );
}

import { getIdFromModel } from '../lib/schema';

export default function initApiMethods( fetch, store, getRouteConfig ) {

  // TODO: use some more specific method from store's undo implementation
  const isUndo      = () => store._getState( '_reset' );
  const shouldFetch = path => !isUndo() && !store.getPending( path ) && !store.getError( path );

  const api = ['get', 'post', 'put', 'delete' ].reduce(( memo, method ) => ({
    ...memo,
    [method]: ( path, ...args ) => {
      store.setPending( path, true );
      return fetch[ method ]( path, ...args )
        .then(
          response => {
            store.setPending( path, false );
            store.setError( path, null, { quiet: true } );
            return response;
          },
          err => {
            store.setPending( path, false );
            store.setError( path, err );
            return Promise.reject( err );
          }
        );
    }
  }), {});

  const methods = {

    fetchAll: path => {
      const { route: defaultRoute, method, onSuccess, onError } = getRouteConfig( 'list' );
      const route = path || defaultRoute;
      if ( shouldFetch( route ) ) {
        return api[ method ]( route )
          .then( onSuccess )
          .then( response => {
            store.setCollection( response, route );
            return response;
          })
          .catch( onError );
      } else {
        // TODO: store pendingpromise to return here?
      }
    },

    fetchOne: id => {
      const { route, method, onSuccess, onError } = getRouteConfig( 'get', id );
      if ( shouldFetch( route ) ) {
        return api[ method ]( route )
          .then( onSuccess )
          .then( response => {
            store.setModel( getIdFromModel( response ), { ...response, _fetched: true });
            return response;
          })
          .catch( onError );

      } else {
        // TODO: store pendingpromise to return here?
      }
    },

    createOne: ( data, options = {} ) => {
      const { route, method, onSuccess, onError } = getRouteConfig( 'create', data );
      return api[ method ]( route, data )
        .then( onSuccess )
        .then( data => {
          if ( options.refetch !== false ) {
            methods.fetchAll();
          } else {
            store.updateCollection( data );
          }
          return data;
        })
        .catch( onError );
    },

    updateOne: ( id, data ) => {
      const { route, method, onSuccess, onError } = getRouteConfig( 'update', id, data );
      return api[ method ]( route, data )
        .then( onSuccess, onError );
    },

    deleteOne: id => {
      const { route, method, onSuccess, onError } = getRouteConfig( 'delete', id );
      return api[ method ]( route )
        .then( onSuccess, onError );
    },

    custom: config =>
      api[ config.method ]( config.route, config.body )
        .then( config.onSuccess )
        .then( response => {
          store.setRequestsData( config.route, response );
          return response;
        })
        .catch( config.onError ),

    shouldFetch,
    ...api
  };

  return methods;
}

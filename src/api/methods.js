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
      const { route: defaultRoute, method, getData, onError } = getRouteConfig( 'list' );
      const route = path || defaultRoute;
      if ( shouldFetch( route ) ) {
        return api[ method ]( route ).then( response => {
          const data = getData( response );
          store.setCollection( data, route );
          return response;
        })
        .catch( onError );
      } else {
        // TODO: store pendingpromise to return here?
      }
    },

    fetchOne: id => {
      const { route, method, getData, onError } = getRouteConfig( 'get', id );
      if ( shouldFetch( route ) ) {
        return api[ method ]( route ).then( response => {
          const data = getData( response );
          store.setModel( getIdFromModel( data ), { ...data, _fetched: true });
          return response;
        })
        .catch( onError );

      } else {
        // TODO: store pendingpromise to return here?
      }
    },

    createOne: ( data, options = {} ) => {
      const { route, method, getData, onError } = getRouteConfig( 'create', data );
      return api[ method ]( route, data ).then( data => {
        if ( options.refetch !== false ) {
          methods.fetchAll();
        } else {
          store.updateCollection( getData( data ) );
        }
        return data;
      })
      .catch( onError );
    },

    updateOne: ( id, data ) => {
      const { route, method, onError } = getRouteConfig( 'update', id, data );
      return api[ method ]( route, data ).catch( onError );
    },

    deleteOne: id => {
      const { route, method, onError } = getRouteConfig( 'delete', id );
      return api[ method ]( route ).catch( onError );
    },

    custom: config =>
      api[ config.method ]( config.route, config.body )
        .then( response => {
          const data = config.getData( response );
          store.setRequestsData( config.route, data );
          return response;
        })
        .catch( config.onError ),

    shouldFetch,
    ...api
  };

  return methods;
}

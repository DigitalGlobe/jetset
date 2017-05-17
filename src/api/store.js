import { Map, List } from 'immutable';

import { getIdFromModel } from '../lib/schema';
import store from '../store';

/* basic state tree layout
* {
*   $api: {
*     [url]: {
*       [resource]: {
*         models: {
*           [id]: {
*             [key]: any,
*             _fetched?: boolean
*           }
*         },
*         requests: {
*           [url]: {
*             pending?: boolean,
*             error?: Object,
*             data?: List | Map
*           }
*         }
*       }
*     }
*   }
* }
*/

export default function initApiStore( url, schema ) {

  const resourceType = schema.title;
  const rootPath = [ '$api', url, resourceType ];

  const methods = {

    // core

    _getState: store.getState,

    getState: key =>
      store.getState( rootPath.concat( key || [] ).map( item => String( item ) ) ),

    setState: ( val, key ) =>
      store.setState( rootPath.concat( key || [] ).map( item => String( item ) ), val ),

    setStateQuiet: ( val, key ) =>
      store.setStateQuiet( rootPath.concat( key || [] ), val ),

    // requests

    requestsPath: path => [ 'requests' ].concat( path || [] ),

    getRequests: path =>
      methods.getState( methods.requestsPath( path ) ),

    getRequestsData: path =>
      methods.getRequests([ path, 'data' ]),

    setRequests: ( data, path ) =>
      methods.setState( data, methods.requestsPath( path ) ),

    setRequestsData: ( path, data ) =>
      methods.setRequests( data, [ path, 'data' ] ),

    getPending: path =>
      methods.getRequests([ path, 'pending' ]),

    setPending: ( path, data ) =>
      methods.setStateQuiet( data, methods.requestsPath([ path, 'pending' ]) ),

    getError: path =>
      methods.getRequests([ path, 'error' ]),

    setError: ( path, error, options = {} ) => {
      const method = options.quiet ? methods.setStateQuiet : methods.setState;
      method( error, methods.requestsPath([ path, 'error' ]) );
    },

    // models

    getModels: () =>
      methods.getState( 'models' ) || Map(),

    setModels: data =>
      methods.setState( data, 'models' ),

    getModel: id =>
      methods.getState([ 'models', id ]),

    setModel: ( id, data ) =>
      methods.setState( data, [ 'models', id ] ),

    deleteModel: id => {
      const undo = [];
      const state = methods.getState();
      const idStr = String( id );
      methods.setState( state.withMutations( map => {
        const model = methods.getModel( idStr );
        if ( model ) {
          map.update( 'models', ( models = Map() ) => models.delete( idStr ) );
          undo.push(() => methods.setModels( methods.getModels().set( idStr, model ) ));
          undo.push( ...methods.removeFromCollections( map, idStr ) );
        }
      }));
      return undo;
    },

    updateModel: ( id, vals ) => {
      const undo = [];
      const model = methods.getModel( id );
      if ( model ) {
        methods.setModel( id, model.mergeDeep( vals ) );
        undo.push(() => methods.setModels( methods.getModels().set( id, model ) ) );
      }
      return undo;
    },

    // collections (lists hydrated with models)

    getCollection: path => {
      const collection = methods.getRequestsData( path );
      if ( collection ) {
        const models = methods.getModels();
        return collection.reduce(( memo, id ) => {
          const model = models.get( id );
          if ( model ) return memo.push( model );
          return memo;
        }, List());
      } else {
        return null;
      }
    },

    setCollection: ( data = List(), path = '/' ) => {
      const state = methods.getState();
      const nextState = state.withMutations( map => {
        const dict = data.reduce(( memo, item ) => ({ ...memo, [getIdFromModel( item )]: item }), {});
        map.update( 'models', ( models = Map() ) => models.mergeDeep( dict ) );
        map.setIn( methods.requestsPath([ path, 'data' ]), List( Object.keys( dict ) ) );
      });
      methods.setState( nextState );
    },

    clearCollection: ( path = '/' ) => 
      methods.setRequestsData( path, null ),

    removeFromCollections: ( map, id ) =>
      [ ...map.getIn( methods.requestsPath() ).entries() ]
        .reduce(( undo, [path, request] ) => {
          const collection = request.get( 'data' );
          if ( List.isList( collection ) ) {
            const modelIdx = collection.findIndex( modelId => modelId === id );
            if ( ~modelIdx ) {
              const nextCollection = collection.delete( modelIdx );
              map.setIn( methods.requestsPath([ path, 'data' ]), nextCollection );
              undo.push(() => methods.setCollection( nextCollection.insert( modelIdx, id ), path ));
            }
          }
          return undo;
        }, []),

    clearAll: () => {
      methods.setRequests( Map() );
      methods.setModels( Map() );
    }
  };

  return methods;
}

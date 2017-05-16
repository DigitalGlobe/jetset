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

  const methods = {

    // core

    _getState: store.getState,

    getState: key =>
      store.getState([ '$api', url, resourceType ].concat( key || [] ).map( item => String( item ) ) ),

    setState: ( val, key ) => 
      store.setState([ '$api', url, resourceType ].concat( key || [] ).map( item => String( item ) ), val ),

    setStateQuiet: ( val, key ) => 
      store.setStateQuiet([ '$api', url, resourceType ].concat( key || [] ), val ),

    // requests

    getRequests: path => 
      methods.getState([ 'requests' ].concat( path || [] ) ),

    getRequestsData: path => 
      methods.getRequests([ path, 'data' ]),

    setRequests: ( data, path ) => 
      methods.setState( data, [ 'requests' ].concat( path || [] ) ),

    setRequestsData: ( path, data ) => 
      methods.setRequests( data, [ path, 'data' ] ),

    getPending: path => 
      methods.getRequests([ path, 'pending' ]),

    setPending: ( path, data ) => 
      methods.setStateQuiet( data, [ 'requests', path, 'pending' ]),

    getError: path => 
      methods.getRequests([ path, 'error' ]),

    setError: ( path, error, options = {} ) => {
      const method = options.quiet ? methods.setStateQuiet : methods.setState;
      method( error, [ 'requests', path, 'error' ] );
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
      methods.setState( state.withMutations( map => {
        const model = methods.getModel( id );
        if ( model ) {
          map.set( 'models', methods.getModels().delete( id ) );
          undo.push(() => methods.setModels( methods.getModels().set( id, model ) ));
          undo.push( ...methods.removeFromCollections( map, id ) );
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
        map.set( 'models', methods.getModels().mergeDeep( dict ) );
        map.setIn([ 'requests', path, 'data' ], List( Object.keys( dict ) ) );
      });
      methods.setState( nextState );
    },

    clearCollection: ( path = '/' ) => 
      methods.setRequestsData( path, null ),

    removeFromCollections: ( map, id ) =>
      [ ...map.get( 'requests' ).entries() ]
        .reduce(( undo, [path, request] ) => {
          const collection = request.get( 'data' );
          if ( List.isList( collection ) ) {
            const modelIdx = collection.findIndex( modelId => modelId === id );
            if ( ~modelIdx ) {
              const nextCollection = collection.delete( modelIdx );
              map.setIn([ 'requests', path, 'data' ], nextCollection );
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

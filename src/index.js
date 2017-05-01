/* state tree
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
/* eslint-disable no-console */
import React from 'react';
import { List, Map, fromJS } from 'immutable';
import initFetch from 'fetch';

import { isSchema, getIdField } from './lib/schema';
import store from './store';

// TODO: use some more specific method from store's undo implementation
const isUndo = () => store.getState( '_reset' );

const fetch = initFetch();

function createActions( props ) {

  return Object.keys( props ).reduce(( memo, key ) => {

    if ( isSchema( props[ key ] ) ) {

      const schema       = props[ key ];
      const idField      = getIdField( schema );
      const resourceType = schema.title;
      const resourcePath = `/${resourceType}`;
      const url          = `${props.url}${resourcePath}`;

      const getState      = key => store.getState([ '$api', props.url, resourceType ].concat( key || [] ));
      const setState      = ( val, key ) => store.setState([ '$api', props.url, resourceType ].concat( key || [] ), val );
      const setStateQuiet = ( val, key ) => store.setStateQuiet([ '$api', props.url, resourceType ].concat( key || [] ), val );

      const getCollection = path => {
        const collection = getState([ 'requests', path, 'data' ]);
        if ( collection ) {
          const models = getModels();
          return collection.map( id => models.get( id ) );
        } else {
          return null;
        }
      };

      const setCollection = ( data = List(), path = '/' ) => {
        const state = getState();
        const nextState = state.withMutations( map => {
          const dict = data.reduce(( memo, item ) => ({ ...memo, [item[idField]]: item }), {});
          map.set( 'models', getModels().merge( dict ) );
          map.setIn([ 'requests', path, 'data' ], List( Object.keys( dict ) ) );
        });
        setState( nextState );
      };

      const getModels  = () => getState( 'models' ) || Map();
      const setModels  = data => setState( data, 'models' );
      const getModel   = id => getState([ 'models', id ]);
      const setModel   = data => setState( fromJS( data ), [ 'models', data[ idField ] ] );
      const getPending = path => getState([ 'requests', path, 'pending' ]);
      const setPending = ( path, data ) => setStateQuiet( data, [ 'requests', path, 'pending' ]);
      const getError   = path => getState([ 'requests', path, 'error' ]);
      const setError   = ( path, error ) => setState( error, [ 'requests', path, 'error' ]);

      const setSearchResults = path => data => setCollection( data, path );
      const getSearchResults = path => getCollection( path );

      const removeFromCollections = ( map, id ) => 
        [ ...map.get( 'requests' ).entries() ]
          .reduce(( undo, [path, request] ) => {
            const collection = request.get( 'data' );
            if ( List.isList( collection ) ) {
              const modelIdx = collection.findIndex( modelId => modelId === id );
              if ( ~modelIdx ) {
                const nextCollection = collection.delete( modelIdx );
                map.setIn([ 'requests', path, 'data' ], nextCollection );
                undo.push(() => setCollection( nextCollection.insert( modelIdx, id ), path ));
              }
            }
            return undo;
          }, []);

      const deleteModel = id => {
        const undo = [];
        const state = getState();
        setState( state.withMutations( map => {
          const model = getModel( id );
          if ( model ) {
            map.set( 'models', getModels().delete( id ) );
            undo.push(() => setModels( getModels().set( id, model ) ));
            undo.push( ...removeFromCollections( map, id ) );
          }
        }));
        return undo;
      };

      const updateModel = ( id, vals ) => {
        const undo = [];
        const model = getModel( id );
        if ( model ) {
          setModels( getModels().set( id, model.merge( vals ) ) );
          undo.push(() => setModels( getModels().set( id, model ) ) );
        }
        return undo;
      };

      const shouldFetch = path => !isUndo() && !getPending( path );

      const api = ['get', 'post', 'put', 'delete' ].reduce(( memo, method ) => ({
        ...memo,
        [method]: ( path, ...args ) => {
          setPending( path, true );
          return fetch[ method ]( `${url}${path === '/' ? '' : path}`, ...args )
            .then(
              data => {
                setPending( path, false );
                return data;
              },
              err => {
                setPending( path, false );
                setError( path, err );
                return Promise.reject( err );
              }
            );
        }
      }), {});

      /**
       * api calls
       */
      const fetchAll = () => {
        const path = '/';
        if ( shouldFetch( path ) ) {
          api.get( path ).then( data => setCollection( data, path ) );
        }
      };

      const fetchOne = id => {
        const path = `/${id}`;
        if ( shouldFetch( path ) ) {
          api.get( path ).then( data => setModel({ ...data, _fetched: true }));
        }
      };

      const createOne = data => api.post( '/', data ).then( data => {
        fetchAll();
        return data;
      });

      const updateOne = ( id, data ) => api.put( `/${id}`, data );

      const deleteOne = id => api.delete( `/${id}` );

      const search = queryString => {
        const path = `?${queryString}`;
        if ( shouldFetch( path ) ) {
          return api.get( path ).then( setSearchResults( path ) );
        }
        // TODO: store promise as pending value so it can be used on repeat
        // calls
        return Promise.resolve( 'pending' );
      };

      /**/

      const $delete = id => () => {
        const undoDelete = deleteModel( id );
        if ( undoDelete.length ) {
          return deleteOne( id ).catch( err => {
            console.error( 'Failed to delete', id, err );
            undoDelete.forEach( undo => undo() );
            return Promise.reject( err );
          });
        } else {
          return Promise.reject( new Error( 404 ) );
        }
      };

      const $update = id => vals => {
        const undoUpdate = updateModel( id, vals );
        if ( undoUpdate.length ) {
          return updateOne( id, vals ).catch( err => {
            console.error( 'Failed to update', id, 'with vals', vals, err );
            undoUpdate.forEach( undo => undo() );
            return Promise.reject( err );
          });
        } else {
          return Promise.reject( new Error( 404 ) );
        }
      };

      const getPlaceholder = ( dataType = List ) => {
        const placeholder = dataType();
        placeholder.$isPending = true;
        placeholder.$error = null;
        return placeholder;
      };

      const addRestMethods = model => {
        model.$delete = $delete( model.get( idField ) );
        model.$update = $update( model.get( idField ) );
        return model;
      };

      const main = () => {
        const collection = getCollection( '/' );
        if ( !collection ) {
          fetchAll();
          return getPlaceholder();
        } else {
          return collection.map( addRestMethods );
        }
      };

      main.$get = id => {
        const model = getModel( id );
        if ( !model || !model.get( '_fetched' ) ) {
          fetchOne( id );
          return getPlaceholder( Map );
        } else {
          return addRestMethods( model );
        }
      };

      main._schema       = schema;
      main._resourceType = resourceType;
      main.getState      = getState;

      // TODO: make optimistic?
      main.$create = createOne;

      // call signature: search({ queryOrWhatever: 'foo', otherParam: 0, anotherParam: 30 })
      // - sort so that we can cache consistently
      main.$search = args => {
        const queryString = Object.keys( args ).sort().reduce(( memo, key ) => {
          memo.append( key, args[ key ] );
          return memo;
        }, new URLSearchParams()).toString();
        return search( queryString );
      };

      main.$search.results = args => {
        const queryString = Object.keys( args ).sort().reduce(( memo, key ) => {
          memo.append( key, args[ key ] );
          return memo;
        }, new URLSearchParams()).toString();
        const path = `?${queryString}`;
        const resultsCached = getSearchResults( path );
        if ( resultsCached ) {
          return addRestMethods( resultsCached );
        } else {
          const placeholder = List();
          placeholder.$isPending = !!getPending( path );
          placeholder.$error = getError( path );
          return placeholder;
        }
      };

      // hang standard api methods off of .api so devs can construct
      // non-standard paths
      main.api = [ 'delete', '$get', 'get', 'post', 'put', 'stream' ].reduce(( memo, method ) => ({
        ...memo,
        [method]: ( path, ...args ) => {
          if ( method === '$get' ) {
            const cache = getState([ 'requests', path, 'data' ]);
            if ( cache ) {
              return List.isList( cache )
                ? getCollection( path ).map( addRestMethods )
                : cache;
            } else {
              if ( shouldFetch( path ) ) {
                api.get( path, ...args ).then( data => {
                  if ( Array.isArray( data ) ) {
                    setCollection( data, path );
                  } else {
                    setState( fromJS( data ), [ 'requests', path, 'data' ] );
                  }
                  return data;
                });
              }
              return getPlaceholder();
            }
          } else {
            return api[ method ]( path, ...args );
          }
        }
      }), {});

      memo[ key ] = main;
    }
    return memo;
  }, {} );
}

export default class Api extends React.Component {

  constructor( props ) {
    super( props );
    this.api = createActions( props );
    this.resourceTypes = Object.keys( this.api ).map( key => this.api[ key ]._resourceType );
    this.cache = Map();
    store.subscribe( state => {
      const nextState = state.get( props.url );
      if ( !nextState ) {
        this.forceUpdate();
      } else if ( this.resourceTypes.some( key => nextState.get( key ) !== this.cache.get( key ) ) ) {
        console.log(`re-rendering based on state changes:`, nextState.toJS());
        this.cache = nextState;
        this.forceUpdate();
      }
    });
  }

  render() {
    const { children, ...props } = this.props;
    return children && typeof children.type === 'function'
      ? React.cloneElement( children, { ...props, ...this.api } )
      : children;
  }
}

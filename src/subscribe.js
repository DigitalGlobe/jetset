import React from 'react';
import { fromJS } from 'immutable';

import store from './store';
import logger, { formatBranchArgs } from './lib/log';

const isObject = item => !Array.isArray( item ) && typeof item === 'object';

function subscribe({ local, paths }) {

  return Component => {

    const rootPath = local ? [ 'local', Component.name + `_${Math.round(Math.random() * Date.now())}`] : [];
    const nPaths = paths.reduce(( memo, item ) => {
      if ( isObject( item ) ) {
        Object.keys( item ).forEach( key => memo.set( key, item[ key ] ) );
      } else {
        memo.set( item );
      }
      return memo;
    }, new Map());

    return class Subscriber extends React.Component {

      subscription = null

      constructor( props ) {
        super( props );
        this.state = [ ...nPaths.entries() ].reduce(( memo, [ key, val ] ) => {
          if ( val ) {
            memo[key] = val;
            // TODo this shouldn't happen here
            store.setStateQuiet( rootPath.concat( key ), fromJS( val ) );
          } else {
            const storeVal = store.getState( rootPath.concat( key ) );
            memo[key] = storeVal && storeVal.toJS ? storeVal.toJS() : storeVal;
          }
          return memo;
        }, {});
      }

      componentWillMount = () => {
        this.subscriptions = [ ...nPaths.keys() ].map( this.subscribeTo );
      }

      componentWillUnmount = () => this.subscriptions.forEach( store.unsubscribe )

      subscribeTo = path => store.subscribeTo( rootPath.concat( path ), this.onChange.bind( this, path ) );

      onChange = ( path, state ) => {
        /* eslint-disable no-console */
        const branch = formatBranchArgs( rootPath.concat( path ) );
        logger( `\uD83C\uDF00 <${Component.name || 'StatelessFunction'}> is re-rendering based on changes on branch: ${branch}` );
        this.setState({ [path]: state && state.toJS ? state.toJS() : state });
      }

      merge = ( path, val ) => {
        if ( typeof val !== 'object' ) {
          return this.replace( path, val );
        } else {
          const fullPath = rootPath.concat( path );
          const state = store.getState( fullPath );
          return store.setState( fullPath, state.mergeDeep( val ) );
        }
      }

      replace = ( path, val ) => store.setState( rootPath.concat( path ), val )

      methods = () => [ ...nPaths.keys() ].reduce(( memo, path ) => {
        const currentState = this.state[path];
        return {
          ...memo,
          [path]: {
            get: () => currentState,
            set: val => this.merge( path, val ),
            replace: val => this.replace( path, val )
          }
        };
      }, {})

      render = () => (
        <Component 
          { ...this.props } 
          { ...this.methods() }
        />
      )
    };
  };
}

export function localState( ...paths ) {
  return subscribe({ local: true, paths });
}

export function globalState( ...paths ) {
  return subscribe({ local: false, paths });
}

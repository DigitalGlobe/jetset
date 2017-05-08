import React from 'react';

import store from './store';
import logger, { formatBranchArgs } from './lib/log';

function subscribe({ local, paths }) {

  return Component => {

    const rootPath = local ? [ 'local', Component.name ] : [];

    return class Subscriber extends React.Component {

      subscription = null

      constructor( props ) {
        super( props );
        this.state = {};
      }

      componentWillMount = () => {
        this.subscriptions = paths.map( path => 
          store.subscribeTo( rootPath.concat( path ), this.onChange.bind( this, path ) )
        );
      }

      componentWillUnmount = () => this.subscriptions.forEach( store.unsubscribe )

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

      methods = () => paths.reduce(( memo, path ) => ({
        ...memo,
        [path]: {
          get: () => this.state[ path ],
          set: val => this.merge( path, val ),
          replace: val => this.replace( path, val )
        }
      }), {})

      render = () => (
        <Component 
          { ...this.props } 
          { ...this.methods() }
        />
      )
    };
  };
}

export function local( ...paths ) {
  return subscribe({ local: true, paths });
}

export function global( ...paths ) {
  return subscribe({ local: false, paths });
}

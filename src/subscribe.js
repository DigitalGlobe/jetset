import React from 'react';

import store from './store';
import logger from './lib/log';

export default function( pathToSubscribeTo, initialState ) {

  return Component => {

    const rootPath = [ 'subscriptions' ].concat( pathToSubscribeTo );

    return class Subscriber extends React.Component {

      subscription = null

      constructor( props ) {
        super( props );
        this.state = {
          store: initialState || null
        };
      }

      componentWillMount = () => (
        this.subscription = store.subscribeTo( rootPath, this.onChange, initialState )
      )

      componentWillUnmount = () => store.unsubscribe( this.subscription )

      onChange = state => {
        /* eslint-disable no-console */
        logger( `\uD83C\uDF00 <${Component.name || 'StatelessFunction'}> is re-rendering based on changes on branch: ${rootPath}` );
        this.setState({ store: state && state.toJS ? state.toJS() : state });
      }

      publish = ( maybeKey, maybeVal ) => {
        const path = rootPath.concat( maybeVal ? maybeKey : [] );
        const state = maybeVal || maybeKey;
        store.setState( path, state );
      }

      render = () => (
        <Component 
          { ...this.props } 
          { ...{ [pathToSubscribeTo]: {
            get: () => this.state.store,
            set: this.publish
          }}}
        />
      )
    };
  };
}


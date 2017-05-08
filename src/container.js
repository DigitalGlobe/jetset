import React from 'react';
import { fromJS, Map as iMap } from 'immutable';

import store from './store';
import logger from './lib/log';

export default function containerize( initialState ) {

  return function decorate( Component ) {

    const masterKey = Component.key || Component.name;
    const rootPath = [ 'containers', masterKey ];

    return class Container extends React.Component {

      subscription = null

      constructor( props ) {
        super( props );
        const currentState = store.getState( rootPath );
        if ( currentState ) {
          this.state = { container: currentState.toJS ? currentState.toJS() : currentState };
        } else {
          this.state = { container : initialState };
          store.setStateQuiet( rootPath, initialState );
        }
      }

      componentWillMount = () => {
        this.subscription = store.subscribeTo( rootPath, state => {
          /* eslint-disable no-console */
          logger( `\uD83C\uDF00 re-rendering container <${masterKey}>` );
          this.setState({ container: state && state.toJS ? state.toJS() : state });
        });
      }

      componentWillUnmount = () => store.unsubscribe( this.subscription )

      getStoreState = () => store.getState( rootPath )
      setStoreState = val => {
        const state = this.getStoreState() || iMap();
        store.setState( rootPath, state.mergeDeep( fromJS( val ) ) );
      }

      replaceStoreState = val => store.setState( rootPath, val )

      render() {
        return (
          <Component 
            { ...this.props } 
            container={{
              get: () => this.state.container,
              set: this.setStoreState,
              replace: this.replaceStoreState,
              state: this.state.container
            }} 
          />
        );
      }
    };
  };
}

export function Children({ children, container, ...props }) { // eslint-disable-line 
  return children && typeof children.type === 'function'
    ? React.cloneElement( children, props )
    : children;
}

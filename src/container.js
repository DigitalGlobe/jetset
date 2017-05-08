import React from 'react';
import { fromJS } from 'immutable';

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
        this.state = { container: initialState };
      }

      componentWillMount = () => {
        this.subscription = store.subscribeTo([ 'containers', masterKey ], state => {
          if ( state ) {
            /* eslint-disable no-console */
            logger( `\uD83C\uDF00 re-rendering container <${masterKey}>` );
            this.setState({ container: state && state.toJS ? state.toJS() : state });
          }
        });
      }

      componentWillUnmount = () => store.unsubscribe( this.subscription )

      getStoreState = key => store.getState([ 'containers', masterKey, key ])
      setStoreState = ( key, val ) => store.setState([ 'containers', masterKey, key ], fromJS( val ) )

      render() {
        return (
          <Component 
            { ...this.props } 
            container={{
              get: this.getStoreState, 
              set: this.setStoreState,
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

import React from 'react';
import { fromJS, Map as iMap } from 'immutable';

import store from './store';
import logger from './lib/log';
import { createChildren, Children } from './lib/children';

export default function containerize( initialState ) {

  return function decorate( Component ) {

    const masterKey = Component.key || Component.name;
    const rootPath = [ 'containers', masterKey ];

    class Container extends React.Component {

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
        return Children({
          ...this.props,
          container: {
            get:     () => this.state.container,
            set:     this.setStoreState,
            replace: this.replaceStoreState,
            state:   this.state.container
          }
        });
      }
    }

    function ContainerDecorator( children, maybeComponent, maybeContext ) {
      return maybeContext
        ? React.createElement( Container, {}, createChildren( children, maybeComponent ) )
        : ContainerDecorator.bind( null, [].concat( children, maybeComponent || [] ) );
    }

    return ContainerDecorator( Component );
  };
}


import React from 'react';

import store from './store';
import logger from './lib/log';

export default function( pathToSubscribeTo ) {

  return Component =>

    class Subscriber extends React.Component {

      subscription = null

      constructor( props ) {
        super( props );
        this.state = {
          store: null
        };
      }

      componentWillMount = () => (
        this.subscription = store.subscribeTo( pathToSubscribeTo, this.onChange )
      )

      componentWillUnmount = () => store.unsubscribe( this.subscription )

      onChange = state => {
        /* eslint-disable no-console */
        logger( `\uD83D\uDCC5 <${Component.name || 'StatelessFunction'}> is re-rendering due to subscribed change`, state && state.toJS ? state.toJS() :  state );
        this.setState({ store: state });
      }

      publish = ( maybeKey, maybeVal ) => {
        const path = [ pathToSubscribeTo ].concat( maybeVal ? maybeKey : [] );
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
}


import React from 'react';
import PropTypes from 'prop-types';

import logger, { formatBranchArgs } from '../lib/log';
import createActions from './main';
import store from '../store';

export default class Api extends React.Component {

  static propTypes = {
    url:           PropTypes.string.isRequired,
    // see https://github.com/github/fetch#sending-cookies for reference
    credentials:   PropTypes.oneOf( [ 'same-origin', 'include' ] ),
    token:         PropTypes.string,
    auth:          PropTypes.string,
    authorization: PropTypes.string
  }

  subscriptions = []

  constructor( props ) {
    super( props );
    this.api = createActions( props );
    this.state = { cache: null };
  }

  componentWillMount() {
    this.subscriptions = Object.keys( this.api ).map( key =>
      store.subscribeTo( this.api[ key ].subscribePath, state => {
        logger(`\uD83C\uDF00 <Api> is re-rendering based on state changes on branch: %c${formatBranchArgs( this.api[ key ].subscribePath )}`, 'color: #5B4532' );
        this.setState({ cache: state });
      })
    );
  }

  componentWillReceiveProps( nextProps ) {
    if ( this.props !== nextProps ) {
      this.api = createActions( nextProps );
    }
  }

  componentWillUnmount() {
    this.subscriptions.forEach( subscription => store.unsubscribe( subscription ) );
  }

  // TODO: allow for multiple children
  render() {
    const { children, ...props } = this.props;
    const isValidChild = children && typeof children.type === 'function';
    if ( isValidChild ) {
      return React.cloneElement( children, { ...props, ...this.api } );
    } else {
      logger( '\u26A0 Warning: You have passed a child into <Api> that cannot receive its props. Be sure your custom component(s) are the only children of <Api>', children );
      return null;
    }
  }
}



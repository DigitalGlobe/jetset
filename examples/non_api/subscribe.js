import React from 'react';
import { globalState } from '../../src/subscribe';

// TODO: we'll need state naming convention + clear way to subscribe to nested
// state
@globalState({ example: 'foo', example2: 'bar' })
class SubscriptionExample extends React.Component {
  render() {
    return (
      <div>
        <div>
          <span>example state: { this.props.example.get() }</span>
          <button onClick={() => this.props.example.set( 'foo' )}>Set to foo</button>
          <button onClick={() => this.props.example.set( 'bar' )}>Set to bar</button>
        </div>
        <div>
          <span>example2 state: { this.props.example2.get() }</span>
          <button onClick={() => this.props.example2.set( 'foo' )}>Set to foo</button>
          <button onClick={() => this.props.example2.set( 'bar' )}>Set to bar</button>
        </div>
      </div>
    );
  }
}

export default SubscriptionExample;

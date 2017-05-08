import React from 'react';
import { globalState, localState } from '../../src/subscribe';

@globalState({ example: 'bar' })
@localState({ localExample: 'foo' })
class CombinedStateExample extends React.Component {
  render() {
    return (
      <div>
        <div>
          <span>local example state: { this.props.localExample.get() }</span>
          <button onClick={() => this.props.localExample.set( 'foo' )}>Set to foo</button>
          <button onClick={() => this.props.localExample.set( 'bar' )}>Set to bar</button>
        </div>
        <div>
          <span>example2 state: { this.props.example.get() }</span>
          <button onClick={() => this.props.example.set( 'foo' )}>Set to foo</button>
          <button onClick={() => this.props.example.set( 'bar' )}>Set to bar</button>
        </div>
      </div>
    );
  }
}

export default CombinedStateExample;



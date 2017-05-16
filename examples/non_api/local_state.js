import React from 'react';
import { localState } from '../../src/subscribe';

@localState({ example: 'foo', example2: 'bar' })
class LocalStateExample extends React.Component {
  render() {
    return (
      <div>
        <div>
          <span>example state: { this.props.example.get() }</span>
          <button onClick={() => this.props.example.set( 'foo' )}>Set to foo</button>
          <button onClick={() => this.props.localState.set({ example: 'bar' })}>Set to bar</button>
        </div>
        <div>
          <span>example2 state: { this.props.example2.get() }</span>
          <button onClick={() => this.props.example2.set( 'foo' )}>Set to foo</button>
          <button onClick={() => this.props.localState.set({ example2: 'bar' })}>Set to bar</button>
        </div>
      </div>
    );
  }
}

export default LocalStateExample;


import React from 'react';
import { globalState } from '../../src/index';

// TODO: we'll need state naming convention + clear way to subscribe to nested
// state
@globalState('exampleWithNoInitialState')
class GlobalStateExample extends React.Component {
  render() {
    return (
      <div>
        <div>
          <span>exampleWithNoInitialState: { this.props.exampleWithNoInitialState.get() || 'n/a'}</span>
          <button onClick={() => this.props.exampleWithNoInitialState.set( 'foo' )}>Set to foo</button>
          <button onClick={() => this.props.exampleWithNoInitialState.set( 'bar' )}>Set to bar</button>
        </div>
      </div>
    );
  }
}

export default GlobalStateExample;

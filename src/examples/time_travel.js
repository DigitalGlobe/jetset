import React from 'react';
import store from '../lib/store';

export default class TimeTravelExample extends React.Component {
  constructor( props ) {
    super( props );
    this.state = { skipExpansions: false };
  }
  render() {
    const ignore = this.state.skipExpansions ? 'expansions' : null;
    return (
      <div>
        <button onClick={() => store.prevState({ ignore })}>Back</button>
        <button onClick={() => store.nextState({ ignore })}>Forward</button>
        <button onClick={() => store.resetState()}>Reset</button>
        <input type="checkbox" onClick={() => this.setState({ skipExpansions: !this.state.skipExpansions })}/> Skip tree expansion state changes
      </div>
    );
  }
}


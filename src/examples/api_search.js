import React from 'react';
import { sources } from './api_decorator';

@sources
export default class ApiSearchExample extends React.Component {

  constructor( props ) {
    super( props );
    this.state = { query: '' };
  }

  onSubmit = event => {
    event.preventDefault();
    this.setState(
      { query: this.refs.input.value },
      () => this.props.sources.$search( this.state )
    );
  }

  render() {
    const results = this.props.sources.$search.results( this.state );
    return (
      <div>
        <div>
          <form onSubmit={ this.onSubmit }>
            <input ref="input" type="text" />
            <button>Search</button>
          </form>
        </div>
        <div>
        { results.$isPending ?
          <div>Searching...</div>
        :
          results.map( result =>
            <div key={ result.get( '_id' ) }>{ result.get( 'title' ) }</div>
          )}
        </div>
      </div>
    );
  }
}

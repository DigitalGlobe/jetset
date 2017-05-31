import React from 'react';
import { users } from './api_decorator';

@users
export default class ApiSearchExample extends React.Component {

  constructor( props ) {
    super( props );
    this.state = { username: '' };
  }

  onSubmit = event => {
    event.preventDefault();
    this.setState(
      { username: this.refs.input.value },
      () => this.props.users.$search( this.state )
    );
  }

  render() {
    const results = this.props.users.$search.results( this.state );
    return (
      <div>
        <div>
          <form onSubmit={ this.onSubmit }>
            <input ref="input" type="text" placeholder="Try 'Bret' or 'Delphine'"/>
            <button>Search</button>
          </form>
        </div>
        <div>
        { results.$isPending ?
          <div>Searching...</div>
        :
          results.map( result =>
            <div key={ result.get( 'id' ) }>{ result.get( 'name' ) }</div>
          )}
        </div>
      </div>
    );
  }
}

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
      () => this.props.users.search( this.state )
    );
  }

  render() {
    const { search } = this.props.users;
    const results = search.results( this.state );
    return (
      <div>
        <div>
          <form onSubmit={ this.onSubmit }>
            <input ref="input" type="text" placeholder="Try 'Bret' or 'Delphine'"/>
            <button>Search</button>
          </form>
        </div>
        <div>
        { results.isPending ?
          <div>Searching...</div>
        :
          results.data.map(({ data }) =>
            <div key={ data.id }>{ data.name }</div>
          )}
        </div>
      </div>
    );
  }
}

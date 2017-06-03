import React from 'react';
import { users } from './api_decorator';

@users
export default class RawApiExample extends React.Component {

  handleClick = () => this.props.users.api.post( '/1/albums', {} )

  render() {
    return (
      <div>
        <button onClick={ this.handleClick }>FOO!</button>
        <div>
          { this.props.users.api.$get( '/1/albums' ).map( item => (
            <span key={ item.id }>{ item.title }</span>
          ))}
        </div>
      </div>
    );
  }
}

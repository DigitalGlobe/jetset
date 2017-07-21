import React from 'react';
import { users } from './api_decorator';

@users
export default class RawApiExample extends React.Component {

  handleClick = () => this.props.users.api.post( '/1/albums', {} )

  render() {
    const { users } = this.props;
    return (
      <div>
        <button onClick={ this.handleClick }>FOO!</button>
        <div>
          { users.api.$get( '/1/albums' ).data.map(({ data }) => (
            <span key={ data.id }>{ data.title }</span>
          ))}
        </div>
      </div>
    );
  }
}

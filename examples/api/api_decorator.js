import React from 'react';
import decorator from '../../src/lib/decorator';

export const users = decorator({
  url:   'https://jsonplaceholder.typicode.com',
  users: '/users'
});

@users
export default class UsersDecorated extends React.Component {
  render() {
    return (
      <span>{ this.props.users.$list().size } Users</span>
    );
  }
}

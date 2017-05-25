import React from 'react';
import { apiDecorator } from '../../src';

export const users = apiDecorator({
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

import React from 'react';
import { apiDecorator } from '../../src';

export const users = apiDecorator({
  url:   'https://jsonplaceholder.typicode.com',
  users: '/users'
});

@users
export default class UsersDecorated extends React.Component {
  render() {
    const { list } = this.props.users;
    return (
      <span>{ list().data.length } Users</span>
    );
  }
}

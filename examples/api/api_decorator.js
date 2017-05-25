import React from 'react';
import decorator from '../../src/lib/decorator';

export const users = decorator({
  url:   'https://jsonplaceholder.typicode.com',
  users: '/users'
});

export const posts = decorator({
  url:   'https://jsonplaceholder.typicode.com',
  posts: '/posts'
});

@users
@posts
export default class UsersDecorated extends React.Component {
  render() {
    return (
      <span>{ this.props.users.$list().size } Users</span>
    );
  }
}

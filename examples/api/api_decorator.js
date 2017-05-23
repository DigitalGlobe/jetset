import React from 'react';
import Api from '../../src/api';

export const users = Component => props =>
  <Api url="https://jsonplaceholder.typicode.com" users="/users">
    <Component { ...props } />
  </Api>;


@users
export default class UsersDecorated extends React.Component {
  render() {
    return (
      <span>{ this.props.users.$list().size } Users</span>
    );
  }
}

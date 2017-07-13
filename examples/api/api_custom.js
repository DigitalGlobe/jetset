import React from 'react';
import { apiDecorator } from '../../src';

const doAsyncStuff = data => new Promise( resolve =>
  setTimeout(() =>
    resolve( data.map( item => ({ ...item, foo: 'bar' }) ) )
  )
);

export const users = apiDecorator({
  url:   'https://jsonplaceholder.typicode.com',
  users: {
    routes: {
      default: '/users',
      getUserAlbums: id => ({ method: 'get', route: `/users/${id}/albums`, usesCache: true }),
      list: () => ({ onSuccess: doAsyncStuff })
    }
  }
});

@users
export default class ApiCustomExample extends React.Component {
  render() {
    return (
      <div>
        <h3>Albums for user 1</h3>
        <div>
          { this.props.users.$getUserAlbums( 1 ).map( item =>
            <div key={ item.id }>{ item.title }</div>
          )}
        </div>
        <h3>Users with extra attrs added</h3>
        <div>
          { this.props.users.$list().map( item =>
            <div key={ item.id }>{ item.name } foo: { item.foo }</div>
          )}
        </div>
      </div>
    );
  }
}

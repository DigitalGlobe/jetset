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
    const { getUserAlbums, list } = this.props.users;
    return (
      <div>
        <h3>Albums for user 1</h3>
        <div>
          { getUserAlbums( 1 ).data.map( item =>
            <div key={ item.id }>{ item.title }</div>
          )}
        </div>
        <h3>Users with extra attrs added</h3>
        <div>
          { list().data.map(({ data }) =>
            <div key={ data.id }>{ data.name } foo: { data.foo }</div>
          )}
        </div>
      </div>
    );
  }
}

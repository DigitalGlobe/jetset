import React from 'react';
import Api from '../../src/api';

function Users({ users }) {
  return (
    <div>
      { users.$list().$isPending ?
        <span>Loading...</span>
      :
        <span>
          {users.$list().map( user =>
            <div key={ user.get( 'id' ) }>
              <span>{ user.get( 'name' ) }</span>
            </div>
          )}
        </span>
      }
    </div>
  );
}

export default function ApiImmutableExample() {
  return (
    <Api immutable={ true } url="https://jsonplaceholder.typicode.com" users="/users">
      <Users />
    </Api>
  );
}

import React from 'react';
import Api from '../../src/index';

function create( users ) {
  users
    .$create({ name: 'foo' }, { refetch: false })
    .then( data => console.log( 'Successfully created', data ) );
}

function Users({ users }) {
  return (
    <div>
      { users.$list().$isPending ?
        <span>Loading...</span>
      :
        <span>
          {users.$list().map(( user, idx ) =>
            <div key={ user.get( 'id' ) }>
              <span>{ user.get( 'name' ) }</span>
              { idx < 10 &&
                <button onClick={() => user.$delete()}>Delete</button>
              }
            </div>
          )}
          {users.$list().size === 10 &&
            <button onClick={() => create( users )}>New foo</button>
          }
          <button onClick={() => users.$list().$clear()}>Clear cache</button>
        </span>
      }
    </div>
  );
}

export default function ApiCollectionsExample() {
  return (
    <Api url="https://jsonplaceholder.typicode.com" users="/users">
      <Users />
    </Api>
  );
}

import React from 'react';
import { users } from './api_decorator';

const UserDetail = users( props => {
  const user = props.users.$list().first();
  if ( user ) {
    const detail = props.users.$get( user.get( 'id' ) );
    return (
      <div style={{ width: '48%' }}>
        {
          detail.$error ?
            `Error: ${ JSON.stringify( detail.$error ) }` :
          detail.$isPending ?
            `Loading...` :
          <code style={{ width: '300px' }}>{ JSON.stringify( detail.toJS() ).replace( /,/g, ', ') }</code>
        }
      </div>
    );
  } else {
    return <div>Waiting for users...</div>;
  }
});

export default UserDetail;

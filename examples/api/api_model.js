import React from 'react';
import { sources } from './api_decorator';

const SourceDetail = sources( props => {
  const source = props.sources.$list().last();
  if ( source ) {
    const detail = props.sources.$get( source.get( '_id' ) );
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
    return <div>Waiting for sources...</div>;
  }
});

export default SourceDetail;

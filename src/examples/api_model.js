import React from 'react';
import { sources } from './api_decorator';

const SourceDetail = sources( props => {
  const source = props.sources().last();
  if ( source ) {
    const detail = props.sources.$get( source.get( '_id' ) );
    return (
      <div>
        {
          detail.$error ?
            `Error: ${ JSON.stringify( detail.$error ) }` :
          detail.$isPending ?
            `Loading...` :
          JSON.stringify( detail.toJS() )
        }
      </div>
    );
  } else {
    return <div>Waiting for sources...</div>
  }
});

export default SourceDetail;

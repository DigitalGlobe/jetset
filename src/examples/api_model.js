import React from 'react';
import { sources } from './api_decorator';

const SourceDetail = sources( props => {
  const source = props.sources().last();
  return source
    ? <div><code>{ JSON.stringify( props.sources.$get( source.get( '_id' ) ).toJS() ) }</code></div>
    : <div>Loading...</div>;
});

export default SourceDetail;

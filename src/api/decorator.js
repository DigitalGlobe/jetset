import React from 'react';
import Api from './index';

const createChildren = ( components, props, index = 0 ) => {
  if ( components[ index ] ) {
    return React.createElement( components[ index ], props, createChildren( components, props, index + 1 ) );
  } else { 
    const { children, ...rest } = props;
    return children ? React.cloneElement( children, rest ) : null;
  }
};

export default apiProps =>
  function ApiDecorator( children, maybeComponent, maybeContext ) {
    return maybeContext
      ? React.createElement( Api, apiProps, createChildren( children, maybeComponent ) )
      : ApiDecorator.bind( null, [].concat( children, maybeComponent || [] ) );
  };

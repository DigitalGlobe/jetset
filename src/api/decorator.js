import React from 'react';
import Api from './index';

const cloneChildren = ( children, props ) =>
  React.Children.map( children, child => typeof child.type === 'function' 
    ? React.cloneElement( child, props ) 
    : null
  );

const createChildren = ( components, props, index = 0 ) => {
  if ( components[ index ] ) {
    return React.createElement( components[ index ], props, createChildren( components, props, index + 1 ) );
  } else { 
    const { children, ...rest } = props;
    return children ? cloneChildren( children, rest ) : null;
  }
};

export default apiProps =>
  function ApiDecorator( children, maybeComponent, maybeContext ) {
    return maybeContext
      ? React.createElement( Api, apiProps, createChildren( children, maybeComponent ) )
      : ApiDecorator.bind( null, [].concat( children, maybeComponent || [] ) );
  };

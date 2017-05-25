import React from 'react';
import Api from './index';

const safeClone = ( child, props ) => 
  child && typeof child.type === 'function'
    ? React.cloneElement( child, props )
    : child;

const cloneChildren = ( children, props ) =>
  <div>{ React.Children.map( children, child => safeClone( child, props ) ) }</div>;

const createChildren = ( components, props, index = 0 ) => {
  if ( components[ index ] ) {
    return React.createElement( components[ index ], props, createChildren( components, props, index + 1 ) );
  } else { 
    const { children, ...rest } = props;
    return children ? (
      React.Children.count( children ) > 1 ?
        cloneChildren( children, rest ) :
        safeClone( children, rest ) 
    ) : null;
  }
};

export default apiProps =>
  function ApiDecorator( children, maybeComponent, maybeContext ) {
    return maybeContext
      ? React.createElement( Api, apiProps, createChildren( children, maybeComponent ) )
      : ApiDecorator.bind( null, [].concat( children, maybeComponent || [] ) );
  };

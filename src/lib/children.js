import React from 'react';

const safeClone = ( child, props ) =>
  child && typeof child.type === 'function'
    ? React.cloneElement( child, props )
    : child;

const cloneChildren = ( children, props ) =>
  <span>{ React.Children.map( children, child => safeClone( child, props ) ) }</span>;

export const createChildren = ( components, props, index = 0 ) => {
  if ( components[ index ] ) {
    return React.createElement( components[ index ], props, createChildren( components, props, index + 1 ) );
  } else {
    const { children, ...rest } = props;
    return children && React.Children.count( children ) > 1
      ? cloneChildren( children, rest )
      : safeClone( children, rest );
  }
};

export const Children = ({ children, ...props }) => { // eslint-disable-line
  return children && typeof children.type === 'function'
    ? React.cloneElement( children, props )
    : children;
};

import React from 'react';
import Api from '../api';

const createChildren = ( components, props, index = 0 ) => {
  if ( components[ index ] ) {
    return React.createElement( components[ index ], props, createChildren( components, props, index + 1 ) );
  } else { 
    const { children, ...rest } = props;
    return children
      ? React.cloneElement( children, rest )
      : null;
  }
};

export default function apiDecorator( apiProps ) {

  function MyApi( props, children ) {
    return React.createElement( Api, apiProps, createChildren( children, props ) );
  }

  return function MaybeDecorate( memo, maybeComponent, maybeContext ) {
    return maybeContext
      ? MyApi( maybeComponent, memo )
      : MaybeDecorate.bind( null, maybeComponent ? memo.concat( maybeComponent ) : [ memo ] );
  };
}


import React from 'react';
import { createChildren } from './children';

export default function createDecorator( Component, props = {} ) {
  return function Decorator( children, maybeComponent, maybeContext ) {
    return maybeContext
      ? React.createElement( Component, props, createChildren( children, maybeComponent ) )
      : Decorator.bind( null, [].concat( children, maybeComponent || [] ) );
  };
}

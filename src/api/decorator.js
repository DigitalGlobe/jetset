import React from 'react';
import Api from './index';
import { createChildren } from '../lib/children';

export default apiProps =>
  function ApiDecorator( children, maybeComponent, maybeContext ) {
    return maybeContext
      ? React.createElement( Api, apiProps, createChildren( children, maybeComponent ) )
      : ApiDecorator.bind( null, [].concat( children, maybeComponent || [] ) );
  };

import React from 'react';
import Api from '../../src/index';

const schema = require( '../schema.json' );

export const sources = Component => props =>
  <Api url="http://localhost:3000/hub/api" schema={ schema }>
    <Component { ...props } />
  </Api>;


@sources
export default class SourcesDecorated extends React.Component {
  render() {
    return (
      <span>{ this.props.sources.$list().size } Sources</span>
    );
  }
}

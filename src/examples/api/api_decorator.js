import React from 'react';
import Api from '../../index';

const sourcesSchema = require( '../schemas/sources' );

export const sources = Component => props =>
  <Api url="http://localhost:3000/hub/api" sources={ sourcesSchema }>
    <Component { ...props } />
  </Api>;


@sources
export default class SourcesDecorated extends React.Component {
  render() {
    return (
      <span>{ this.props.sources().size } Sources</span>
    );
  }
}

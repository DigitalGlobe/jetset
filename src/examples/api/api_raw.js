import React from 'react';
import { sources } from './api_decorator';

@sources
export default class RawApiExample extends React.Component {

  handleClick = () => this.props.sources.api.post( '/returns/collection', {} )

  render() {
    return (
      <div>
        <button onClick={ this.handleClick }>FOO!</button>
        <div>
          { this.props.sources.api.$get( '/returns/collection' ).map( item => (
            <span key={ item.get( '_id' ) }>{ item.get( 'title' )}</span>
          ))}
        </div>
        <div>
          { this.props.sources.api.$get( '/returns/whatever' ).get( 'foo' ) }
        </div>
      </div>
    );
  }
}

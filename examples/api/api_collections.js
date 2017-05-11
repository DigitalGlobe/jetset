import React from 'react';
import Api from '../../src/index';

const sourcesSchema = require( '../schemas/sources.json' );

function create( sources ) {
  sources
    .$create({ title: 'foo' })
    .then( data => console.log( 'Successfully created', data ) );
}

function Sources({ sources }) {
  return (
    <div>
      { sources().$isPending ?
        <span>Loading...</span>
      :
        <span>
          {sources().map( source =>
            <div key={ source.get( '_id' ) }>
              <span>{ source.get( 'title' ) }</span>
              <button onClick={() => source.$delete()}>Delete</button>
            </div>
          )}
          <button onClick={() => create( sources )}>New foo</button>
          <button onClick={() => sources.$clear()}>Clear cache</button>
        </span>
      }
    </div>
  );
}

export default function ApiCollectionsExample() {
  return (
    <Api url="http://localhost:3000/hub/api" sources={sourcesSchema }>
      <Sources />
    </Api>
  );
}

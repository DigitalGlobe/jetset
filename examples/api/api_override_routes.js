import React from 'react';
import Api from '../../src/index';

const schema = require( '../schema.json' );

function Sources({ sources_also }) {
  return (
    <div>
      { sources_also().$isPending ?
        <span>Loading...</span>
      :
        <span>
          {sources_also().map( source =>
            <div key={ source.get( '_id' ) }>
              <span>{ source.get( 'title' ) }</span>
            </div>
          )}
        </span>
      }
    </div>
  );
}

export default function OverrideRoutesExample() {
  const routes = {
    create: () => '/sources'
  };
  return (
    <Api url="http://localhost:3000/hub/api" schema={ schema } sources_also={{ routes }}>
      <Sources />
    </Api>
  );
}


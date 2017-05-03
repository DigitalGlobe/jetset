import React from 'react';
import { Route, Switch } from 'react-router';

import ApiCollectionsExample from './api_collections';
import ApiDecoratorExample   from './api_decorator';
import ApiModelExample       from './api_model';
import ApiSearchExample      from './api_search';
import ApiRawExample         from './api_raw';

export default function ApiExampleRouter() {
  return (
    <Switch>
      <Route path="/api/collections" render={() => (
        <div>
          <div>
            <h1>Sources 1</h1>
            <ApiCollectionsExample />
          </div>
          <hr/>
          <div>
            <h1>Sources 2</h1>
            <ApiCollectionsExample />
          </div>
          <hr/>
          <div>
            <h1>Sources Decorator</h1>
            <ApiDecoratorExample />
          </div>
        </div>
      )} />
      <Route path="/api/model" render={() => (
        <div>
          <h1>Source Detail</h1>
          <ApiModelExample />
        </div>
      )} />
      <Route path="/api/search" render={() => (
        <div>
          <h1>Search Example</h1>
          <ApiSearchExample />
        </div>
      )} />
      <Route path="/api/raw" render={() => (
        <div>
          <h1>Raw Api Example, for non-standard REST routes</h1>
          <ApiRawExample />
        </div>
      )} />
    </Switch>
  );
}

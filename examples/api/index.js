import React from 'react';
import { Route, Switch } from 'react-router';

import ApiCollectionsExample from './api_collections';
import ApiDecoratorExample   from './api_decorator';
import ApiImmutableExample   from './api_immutable';
import ApiModelExample       from './api_model';
import ApiSearchExample      from './api_search';
import ApiRawExample         from './api_raw';
import Gist                  from '../lib/gist';

export default function ApiExampleRouter() {
  return (
    <Switch>
      <Route path="/api/collections" render={() => (
        <div>
          <Gist gist="glortho/2baa82c84bdbea96a981f5d7fca56381" />
          <div>
            <h1>Users</h1>
            <ApiCollectionsExample />
          </div>
          <hr/>
          <div>
            <h1>Users Also</h1>
            <ApiCollectionsExample />
          </div>
          <hr/>
        </div>
      )} />
      <Route path="/api/model" render={() => (
        <div>
          <Gist gist="glortho/94876497b4b08caed0333895c30f4c8a" />
          <h1>User Detail</h1>
          <ApiModelExample />
        </div>
      )} />
      <Route path="/api/search" render={() => (
        <div>
          <Gist gist="glortho/8bba60a8f55e81e68fa5431b7944e7d0" />
          <h1>Search Example</h1>
          <ApiSearchExample />
        </div>
      )} />
      <Route path="/api/raw" render={() => (
        <div>
          <Gist gist="glortho/c4b5d11348f8335969622ff4503e98b6" />
          <h1>Raw Api Example, for non-standard REST routes</h1>
          <ApiRawExample />
        </div>
      )} />
      <Route path="/api/decorator" render={() => (
        <div>
          <Gist gist="glortho/81a14b0fef58e01f799bb35d62f28f42"/>
          <h1>Users Decorator</h1>
          <ApiDecoratorExample />
        </div>
      )} />
      <Route path="/api/immutable" render={() => (
        <div>
          <Gist gist=""/>
          <h1>Immutable option</h1>
          <ApiImmutableExample />
        </div>
      )} />
    </Switch>
  );
}

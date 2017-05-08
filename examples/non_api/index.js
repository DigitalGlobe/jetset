import React from 'react';
import { Route, Switch } from 'react-router';

import ContainerExample   from './container';
import GlobalStateExample from './global_state';
import LocalStateExample  from './local_state';
import Gist               from '../lib/gist';

export default function NonApiRouter() {
  return (
    <Switch>
      <Route path="/non-api/global-state" render={() => (
        <div>
          <Gist gist="glortho/96db2c77ab0bc1b345944fd3e8ab8501" />
          <h1>Use the global state decorator</h1> 
          <div>This makes it easy to set/get/subscribe to state across your app</div>
          <GlobalStateExample />
        </div>
      )} />
      <Route path="/non-api/local-state" render={() => (
        <div>
          {/*<Gist gist="" />*/}
          <h1>Use the local state decorator</h1> 
          <div>Instead of using React component state </div>
          <LocalStateExample />
        </div>
      )} />
      <Route path="/non-api/containers" render={() => (
        <div>
          <Gist gist="glortho/941d7ead6afe5f8e774c479e0fe5ac67" />
          <h1>Containers (similar to react-machine)</h1>
          <ContainerExample />
        </div>
      )} />
    </Switch>
  );
}

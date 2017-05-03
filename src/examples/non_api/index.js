import React from 'react';
import { Route, Switch } from 'react-router';

import ContainerExample    from './container';
import SubscriptionExample from './subscribe';
import Gist from '../lib/gist';

export default function NonApiRouter() {
  return (
    <Switch>
      <Route path="/non-api/subscribe" render={() => (
        <div>
          <Gist gist="glortho/96db2c77ab0bc1b345944fd3e8ab8501" />
          <h1>Use the subscribe decorator</h1> 
          <div>This makes it easy to work with the state tree instead of local component state</div>
          <SubscriptionExample />
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

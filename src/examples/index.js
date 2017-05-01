import React from 'react';
import ReactDOM from 'react-dom';

import ApiCollectionsExample from './api_collections';
import ApiDecoratorExample   from './api_decorator';
import ApiModelExample       from './api_model';
import ApiSearchExample      from './api_search';
import ApiRawExample         from './api_raw';
import ContainerExample      from './container';
import SubscriptionExample   from './subscribe';
import TimeTravelExample     from './time_travel';
import StateTreeView         from './tree_view';

ReactDOM.render((
  <div>
    <div>
      <StateTreeView />
    </div>
    <hr/>
    <div>
      <span>Time Travel</span>
      <TimeTravelExample />
    </div>
    <hr/>
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
    <hr/>
    <div>
      <h1>Source Detail</h1>
      <ApiModelExample />
    </div>
    <hr/>
    <div>
      <h1>Search Example</h1>
      <ApiSearchExample />
    </div>
    <hr/>
    <div>
      <h1>Raw Api Example, for non-standard REST routes</h1>
      <ApiRawExample />
    </div>
    <hr/>
    <div>
      <h1>Use the state tree for whatever</h1>
      <SubscriptionExample />
    </div>
    <hr/>
    <div>
      <h1>Container example without api</h1>
      <ContainerExample />
    </div>
  </div>
), document.getElementById( 'root' ));

// TODO: sources({ id: 1 }).user()
// TODO: ws://
// TODO: support for search

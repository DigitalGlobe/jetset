import React             from 'react';

import ContainerExample    from '../container';
import SubscriptionExample from '../subscribe';

export default function NonApiRouter() {
  return (
    <div>
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
  );
}

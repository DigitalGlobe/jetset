import React                   from 'react';
import ReactDOM                from 'react-dom';
import { Route, Switch }       from 'react-router';
import { BrowserRouter, NavLink } from 'react-router-dom';

import TimeTravelExample from './time_travel';
import StateTreeView     from './tree_view';
import ApiRouter         from './api';
import NonApiRouter      from './non_api';

const styles = {
  style: { marginRight: '8px' },
  activeStyle: { color: 'green' }
};


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
    <BrowserRouter>
      <div>
        <span style={ styles.style }>Api examples:</span>
        <NavLink { ...styles } to="/api/collections">collections + decorator</NavLink>
        <NavLink { ...styles } to="/api/model">model</NavLink>
        <NavLink { ...styles } to="/api/search">search</NavLink>
        <NavLink { ...styles } to="/api/raw">raw api methods</NavLink>
        <span style={ styles.style }>Non-Api:</span>
        <NavLink { ...styles } to="/non-api">examples</NavLink>
        <hr/>
        <Switch>
          <Route path="/api" component={ ApiRouter } />
          <Route path="/non-api" component={ NonApiRouter } />
        </Switch>
      </div>
    </BrowserRouter>
  </div>
), document.getElementById( 'root' ));

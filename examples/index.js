import React                   from 'react';
import ReactDOM                from 'react-dom';
import { Route, Switch }       from 'react-router';
import { BrowserRouter, NavLink } from 'react-router-dom';

import TimeTravelExample from '../src/lib/time_travel';
import StateTreeView     from '../src/lib/tree_view';
import ApiRouter         from './api';
import NonApiRouter      from './non_api';

const styles = {
  style: { marginRight: '8px' },
  activeStyle: { color: 'green' }
};


ReactDOM.render((
  <div>
    <table>
      <tbody>
        <tr>
          <td><StateTreeView /></td>
          <td style={{ verticalAlign: 'top'}}><TimeTravelExample /></td>
        </tr>
      </tbody>
    </table>
    <hr/>
    <BrowserRouter>
      <div>

        <span style={ styles.style }>Api examples:</span>

        <NavLink { ...styles } to="/api/collections">collections</NavLink>
        <NavLink { ...styles } to="/api/model">model</NavLink>
        <NavLink { ...styles } to="/api/search">search</NavLink>
        <NavLink { ...styles } to="/api/raw">raw api methods</NavLink>
        <NavLink { ...styles } to="/api/decorator">decorator</NavLink>

        <span style={ styles.style }>Non-Api examples:</span>

        <NavLink { ...styles } to="/non-api/global-state">global state</NavLink>
        <NavLink { ...styles } to="/non-api/local-state">local state</NavLink>
        <NavLink { ...styles } to="/non-api/combined-state">combined state</NavLink>
        <NavLink { ...styles } to="/non-api/containers">containers</NavLink>

        <hr/>
        <Switch>
          <Route path="/api" component={ ApiRouter } />
          <Route path="/non-api" component={ NonApiRouter } />
        </Switch>
      </div>
    </BrowserRouter>
  </div>
), document.getElementById( 'root' ));

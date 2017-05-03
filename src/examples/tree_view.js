import React from 'react';
import { Map, List } from 'immutable';
import TreeView from 'react-treeview';

import store from '../store';

export function flatten( map, props, expansions, layer = 1 ) {
  return map.map(( val, key ) => { 
    const id = `${layer}-${key}`;
    const onClick = () => props.onClick( id );
    return Map.isMap( val ) || List.isList( val )
      ? React.createElement( TreeView, { key: id, onClick, nodeLabel: <span onClick={ onClick } className="node">{key}</span>, collapsed: !expansions.get( id ) }, flatten( val, props, expansions, layer + 1 ) )
      : <div key={id} className="info">{ key }: {String( null )}</div>;
  });
}

export default class StateTreeView extends React.Component {

  constructor( props ) {
    super( props );
    this.state = { tree: null };
  }

  componentWillMount() {
    store.subscribe( this.onChange );
  }

  componentWillUnmount() {
    store.unsubscribe( this.onChange );
  }

  onChange = state => {
    this.setState({ tree: state });
  }

  handleClick = key => {
    const path = [ 'expansions', key ];
    const current = store.getState( path );
    store.setState( path, !current );
  }

  render() {
    return this.state.tree
      ? <TreeView nodeLabel={ <span onClick={() => this.handleClick( '0-root' )} className="node">state tree</span> } collapsed={ !store.getState([ 'expansions', '0-root']) } onClick={() => this.handleClick( '0-root' )}>{ flatten( this.state.tree, { onClick: this.handleClick }, store.getState( 'expansions' ) || Map() ) }</TreeView>
      : <span>No state to show</span>;
  }
}

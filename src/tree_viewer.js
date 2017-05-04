import React from 'react';
import Portal from 'react-portal';
import TreeView from './lib/tree_view';
import TimeTravel from './lib/time_travel';

function Positioner() {
  const style = {
    position: 'fixed',
    padding: '3px 0px 3px 4px',
    top: '0px',
    left: '0px',
    background: 'white',
    opacity: 0.9,
    borderBottom: '1px solid #ccc',
    boxShadow: '2px 2px 2px #ccc',
    width: '100%',
    zIndex: '10000000000000000000'
  };
  return (
    <div style={ style }>
      <table>
        <tbody>
          <tr>
            <td><TreeView /></td>
            <td style={{ verticalAlign: 'top' }}><TimeTravel /></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function createLink( url ) {
  const link = document.createElement( 'link' );
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = url;
  document.head.appendChild( link );
  return link;
}

export default class TreeViewer extends React.Component {
  constructor( props ) {
    super( props );
    this.state = { show: false };
    this.css = null;
  }
  componentDidMount() {
    this.cssRoot = createLink( 'https://cdn.rawgit.com/glortho/react-treeview/master/react-treeview.css' );
    this.css = createLink( 'https://cdn.rawgit.com/glortho/react-treeview/master/demos/opinionated.css' );
    window.jetset = {
      toggleDevTools: () => this.setState({ show: !this.state.show })
    };
  }
  componentWillUnmount() {
    document.head.removeChild( this.cssRoot );
    document.head.removeChild( this.css );
  }
  render() {
    return (
      <Portal isOpened={ this.state.show }>
        <Positioner />
      </Portal>
    );
  }
}

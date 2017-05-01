import React from 'react';
import container, { Children } from '../lib/container';

@container
class Panels extends React.Component {

  getActive = () => this.props.container.get( 'active' ) || 'n/a';
  setActive = selected => this.props.container.set( 'active', selected );

  render() {
    return Children({ 
      ...this.props, 
      Panels: {
        getActive: this.getActive,
        setActive: this.setActive
      }
    });
  }
}

class Panel extends React.Component {
  render() {
    return (
      <div>
        <span>Active panel is: { this.props.Panels.getActive()}</span>
        <button onClick={() => this.props.Panels.setActive( 'FOO' )}>Set FOO active</button>
        <button onClick={() => this.props.Panels.setActive( 'BAR' )}>Set BAR active</button>
      </div>
    );
  }
}

export default props => <Panels><Panel { ...props }/></Panels>;

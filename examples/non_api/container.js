import React from 'react';
import container, { Children } from '../../src/container';

@container({ active: false })
class Panels extends React.Component {

  getActive = () => this.props.container.get().active;
  setActive = selected => this.props.container.set({ active: selected });

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
    const status = this.props.Panels.getActive();
    return (
      <div>
        <span>Active panel is: { String( status ) }</span>
        <button onClick={() => this.props.Panels.setActive( !status )}>Toggle active</button>
      </div>
    );
  }
}

export default props => <Panels><Panel { ...props }/></Panels>;

import { Map, List } from 'immutable';
import diff from 'immutablediff';

export function managesState() {

  let _state = Map({});

  return {
    getState( args ) {
      return (
        !args ? 
          _state :
        Array.isArray( args ) ?
          _state.getIn( args ) :
        _state.get( args )
      );
    },
    setState( path, val ) {
      _state = (
        Array.isArray( path ) ?
          _state.setIn( path, val ) :
        _state.set( path, val )
      );
    },
    resetState( val, isUndo = true ) {
      _state = val.set( '_reset', isUndo );
      return _state;
    }
  };
}

export function offersSubscription() {

  const subscriptions = new Set();

  return {
    invoke( ...args ) {
      subscriptions.forEach( listener => listener( ...args ) );
    },

    subscribe( callback ) {
      subscriptions.add( callback );
    },

    unsubscribe( callback ) {
      subscriptions.delete( callback );
    }
  };
}

export function canUndo({ apply = () => {} }) {

  let undo = List();
  let idx = -1;

  const methods = {
    /* eslint-disable no-console */
    apply( idxNext, ignore ) {
      const current = undo.get( idx );
      const next = undo.get( idxNext );
      const changes = diff( current, next ).toJS();
      if ( !ignore || !changes.every( item => item.path.indexOf( `/${ignore}` ) === 0 ) ) {
        console.log( `\u23f1 timetravel: diff:`, changes );
        idx = idxNext;
        apply( next );
        return true;
      } else {
        console.log(`\u23f1 timetravel: skipping this state because changes were only on '${ignore}' branch`);
        return false;
      }
    },
    prev({ ignore }) {
      const idxNext = idx - 1;
      if ( idxNext >= -(undo.size) ) {
        const display = idx * -1;
        console.log(`\u23f1 timetravel: stepping back to ${display} state(s) ago` );
        if ( !methods.apply( idxNext ) ) {
          methods.prev({ ignore });
        }
      } else {
        apply( Map({}) );
        console.log(`\u23f1 timetravel: there are no earlier states than this one`);
      }
    },
    next({ ignore }) {
      if ( idx < -1 ) {
        const idxNext = idx + 1;
        console.log(`\u23f1 timetravel: stepping forward to ${idx === -2 ? 'current state' : (idx + 2) * -1 + ' state(s) ago' }`);
        if ( !methods.apply( idxNext ) ) {
          methods.next({ ignore });
        }
      } else {
        console.log(`\u23f1 timetravel: you are at the current state`);
      }
    },
    reset() {
      if ( idx !== -1 ) {
        idx = -1;
        apply( undo.get( idx ), { reset: true } );
      }
      console.log(`\u23f1 timetravel: you are at the current state`);
    },
    save( state ) {
      undo = undo.push( state );
    }
  };

  return methods;
}

const { invoke, subscribe, ...subscriptionMethods } = offersSubscription();
const { setState, resetState, ...stateMethods } = managesState();

// TODO: clarify options
const undo = canUndo({ apply: ( state, options = {} ) => invoke( resetState( state ), !options.reset ) } );

const store = {
  ...subscriptionMethods,
  ...stateMethods,
  setState( ...args ) {
    /* eslint-disable no-console */
    undo.reset();
    console.log( 'setting state:', ...args );
    setState( ...args );
    const state = stateMethods.getState();
    undo.save( state );
    invoke( state );
  },
  setStateQuiet( ...args ) {
    /* eslint-disable no-console */
    console.log( 'setting state quiet (no re-rendering):', ...args );
    setState( ...args );
  },
  subscribe,
  subscribeTo( path, callback ) {
    let cache = null;
    const onChange = state => {
      const nextState = state.getIn( [].concat( path ) );
      if ( nextState !== cache ) {
        callback( nextState );
        cache = nextState;
      }
    };
    subscribe( onChange );
    return onChange;
  },
  nextState: undo.next,
  prevState: undo.prev,
  resetState: undo.reset
};

export default store;

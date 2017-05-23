import { fromJS, Map, List } from 'immutable';
import diff from 'immutablediff';
import logger from './lib/log';

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
      const immutableVal = fromJS( val );
      _state = (
        Array.isArray( path ) ?
          _state.setIn( path, immutableVal ) :
        _state.set( path, immutableVal )
      );
      return _state;
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
      //logger( `\uD83D\uDCC5 unsubscribing`, { callback } );
      subscriptions.delete( callback );
    }
  };
}

export function canUndo({ apply = () => {} } = {}) {

  const log = ( ...args ) => logger( '\u23f1 timetravel: ', ...args );

  let undo = List();
  let idx = -1;

  const methods = {
    apply( idxNext, ignore ) {
      const current = undo.get( idx );
      const next = undo.get( idxNext );
      const changes = diff( current, next ).toJS();
      idx = idxNext;
      if ( !ignore || !changes.every( item => item.path.indexOf( ` ‣ ${ignore}` ) === 0 ) ) {
        log( `diff:`, changes );
        apply( next );
        return true;
      } else {
        log(`skipping this state because changes were only on '${ignore}' branch`);
        return false;
      }
    },
    prev({ ignore } = {}) {
      const idxNext = idx - 1;
      if ( idxNext >= -(undo.size) ) {
        const display = idx * -1;
        log(`stepping back to ${display} state(s) ago` );
        if ( !methods.apply( idxNext, ignore ) ) {
          methods.prev({ ignore });
        }
      } else {
        idx = -(undo.size + 1);
        apply( Map({}) );
        log(`there are no earlier states than this one`);
      }
    },
    next({ ignore } = {}) {
      if ( idx < -1 ) {
        const idxNext = idx + 1;
        log(`stepping forward to ${idx === -2 ? 'current state' : (idx + 2) * -1 + ' state(s) ago' }`);
        if ( !methods.apply( idxNext, ignore ) ) {
          methods.next({ ignore });
        }
      } else {
        log(`you are at the current state`);
      }
    },
    reset() {
      if ( methods.isDirty() ) {
        idx = -1;
        apply( undo.get( idx ), { reset: true } );
      }
      log(`you are at the current state`);
    },
    save( state ) {
      undo = undo.push( state );
      return undo;
    },
    isDirty() {
      return idx !== -1;
    }
  };

  return methods;
}

const { invoke, subscribe, ...subscriptionMethods } = offersSubscription();
const { setState, resetState, ...stateMethods } = managesState();

// TODO: clarify options
const undo = canUndo({ apply: ( state, options = {} ) => invoke( resetState( state ), !options.reset ) } );

const setStateEmoji = '\uD83C\uDFDB';

const store = {
  ...subscriptionMethods,
  ...stateMethods,
  setState( ...args ) {
    if ( undo.isDirty() ) undo.reset();
    const statePrev = stateMethods.getState();
    const stateNext = setState( ...args );
    undo.save( stateNext );
    logger( `${setStateEmoji} setting state: `, diff( statePrev, stateNext ).toJS() );
    // TODO: bump into next event loop to avoid possible collisions?
    invoke( stateNext );
  },
  setStateQuiet( ...args ) {
    const statePrev = stateMethods.getState();
    const stateNext = setState( ...args );
    logger( `%c${setStateEmoji} setting state quiet (no re-rendering):`, `color: #999`, diff( statePrev, stateNext ).toJS() );
  },
  subscribeAll: subscribe,
  subscribeTo( path, callback, initialState ) {
    let cache = null;
    const onChange = state => {
      const nextState = state.getIn( [].concat( path ) );
      if ( nextState !== cache ) {
        callback( nextState );
        cache = nextState;
      }
    };
    subscribe( onChange );
    if ( initialState ) setState( path, initialState );
    return onChange;
  },
  clearState: () => store.setState( Map({}) ),
  nextState:  undo.next,
  prevState:  undo.prev,
  resetState: undo.reset
};

export default store;


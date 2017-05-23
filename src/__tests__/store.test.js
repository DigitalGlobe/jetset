import { fromJS, List, Map } from 'immutable';

const store = require( '../store' );

describe( 'store / state management', () => {

  const { managesState } = store;

  describe( 'setting', () => {

    test( 'sets flat string state', () => {
      const { setState } = managesState();
      const key = 'foo';
      const val = 'bar';
      const expected = Map({ [key]: val });
      const actual = setState( key, val );
      expect( expected ).toEqual( actual );
    });

    test( 'sets flat number state', () => {
      const { setState } = managesState();
      const key = 'foo';
      const val = 1;
      const expected = Map({ [key]: val });
      const actual = setState( key, val );
      expect( expected ).toEqual( actual );
    });

    test( 'sets flat object state', () => {
      const { setState } = managesState();
      const key = 'foo';
      const val = { bar: 'baz' };
      const expected = Map({ [key]: fromJS( val ) });
      const actual = setState( key, val );
      expect( expected ).toEqual( actual );
    });

    test( 'sets flat array state', () => {
      const { setState } = managesState();
      const key = 'foo';
      const val = [ 'bar', 1, null ];
      const expected = Map({ [key]: fromJS( val ) });
      const actual = setState( key, val );
      expect( expected ).toEqual( actual );
    });

    test( 'sets flat mixed state', () => {
      const { setState } = managesState();
      const key = 'foo';
      const val = { bar: [ 'bar', 1, null, { bang: 'foo' } ], baz: 'bang' };
      const expected = Map({ [key]: fromJS( val ) });
      const actual = setState( key, val );
      expect( expected ).toEqual( actual );
    });

    test( 'sets nested state', () => {
      const { setState } = managesState();
      const key = [ 'foo', 'bar' ];
      const val = 'baz';
      const map = Map();
      const expected = map.setIn( key, val );
      const actual = setState( key, val );
      expect( expected ).toEqual( actual );
    });

    test( 'resets state if no path + val is passed in', () => {
      const { setState } = managesState();
      const val = 'foo';
      const expected = val;
      const actual = setState( val );
      expect( expected ).toEqual( actual );
    });
  });

  describe( 'getting', () => {

    test( 'gets flat state', () => {
      const { getState, setState } = managesState();
      const key = 'foo';
      const val = 'bar';
      setState( key, val );
      const expected = val;
      const actual = getState( key );
      expect( expected ).toEqual( actual );
    });

    test( 'gets nested state', () => {
      const { getState, setState } = managesState();
      const key = [ 'foo', 'bar' ];
      const val = { bar: 'baz' };
      setState( key, val );
      const expected = Map( val );
      const actual = getState( key );
      expect( expected ).toEqual( actual );
    });

    test( 'returns raw state if no key is passed', () => {
      const { getState, setState } = managesState();
      const key = 'foo';
      const val = 'bar';
      setState( key, val );
      const expected = Map({[key]: val});
      const actual = getState();
      expect( expected ).toEqual( actual );
    });
  });

  describe( 'resetting', () => {
    test( 'does not flag reset val if undo is false', () => {
      const { resetState } = managesState();
      const val = Map();
      const expected = Map({ _reset: false });
      const actual = resetState( val, false );
      expect( expected ).toEqual( actual );
    });
    test( 'flags reset val if undo is true', () => {
      const { resetState } = managesState();
      const val = Map();
      const expected = Map({ _reset: true });
      const actual = resetState( val );
      expect( expected ).toEqual( actual );
    });
  });
});

describe( 'store / subscriptions', () => {

  const { offersSubscription } = store;

  test( 'adds subscriptions', () => {
    const { subscribe, invoke } = offersSubscription();
    const callback = jest.fn();
    const arg = 'foo';
    subscribe( callback );
    invoke( arg );
    expect( callback ).toHaveBeenCalledWith( arg );
  });

  test( 'unsubscribes', () => {
    const { subscribe, invoke, unsubscribe } = offersSubscription();
    const callback = jest.fn();
    subscribe( callback );
    invoke();
    unsubscribe( callback );
    invoke();
    expect( callback ).toHaveBeenCalledTimes( 1 );
  });
});

describe( 'store / undo', () => {

  const { canUndo } = store;

  test( 'saves undo state', () => {
    const { save } = canUndo();
    const state = 'foo';
    const expected = List([ 'foo' ]);
    const actual = save( state );
    expect( expected ).toEqual( actual );
  });

  test( 'applies undo state', () => {
    const applyMock = jest.fn();
    const { apply, save } = canUndo({ apply: applyMock });
    const state1 = Map({ foo: 'foo' });
    const state2 = Map({ bar: 'bar' });
    save( state1 );
    save( state2 );
    apply( -1 );
    expect( applyMock ).toHaveBeenCalledWith( state2 );
    apply( -2 );
    expect( applyMock ).toHaveBeenLastCalledWith( state1 );
  });

  test( 'skips state when ignore path is specified', () => {
    const applyMock = jest.fn();
    const { apply, save } = canUndo({ apply: applyMock });
    const state1 = Map({ foo: 'foo' });
    const state2 = Map({ foo: 'bar' });
    save( state1 );
    save( state2 );
    const expected = false;
    const actual = apply( -2, 'foo' );
    expect( expected ).toBe( actual );
    expect( applyMock ).not.toHaveBeenCalled();
  });

  test( 'does not skip state when ignore path does not match', () => {
    const applyMock = jest.fn();
    const { apply, save } = canUndo({ apply: applyMock });
    const state1 = Map({ foo: 'foo' });
    const state2 = Map({ foo: 'baz' });
    save( state1 );
    save( state2 );
    const expected = true;
    const actual = apply( -2, 'bar' );
    expect( expected ).toBe( actual );
  });

  test( 'applies previous state when exists', () => {
    const apply = jest.fn();
    const { prev, save } = canUndo({ apply });
    const state1 = Map({ foo: 'foo' });
    const state2 = Map({ bar: 'bar' });
    save( state1 );
    save( state2 );
    prev();
    expect( apply ).toHaveBeenCalledWith( state1 );
  });

  test( 'applies empty state when no previous state exists', () => {
    const apply = jest.fn();
    const { prev, save } = canUndo({ apply });
    const state1 = Map({ foo: 'foo' });
    save( state1 );
    prev();
    expect( apply ).toHaveBeenCalledWith( Map({}) );
  });

  test( 'runs prev recursively when ignore path matches', () => {
    const apply = jest.fn();
    const undo = canUndo({ apply });
    const spy = jest.spyOn( undo, 'apply' );
    const state1 = Map({ foo: 'foo' });
    const state2 = Map({ foo: 'bar' });
    undo.save( state1 );
    undo.save( state2 );
    undo.prev({ ignore: 'foo' });
    expect( spy ).toHaveBeenCalledTimes( 1 );
    expect( apply ).toHaveBeenCalledTimes( 1 );
    expect( apply ).toHaveBeenCalledWith( Map({}) );
  });

  test( 'does not apply next when already at most recent state', () => {
    const apply = jest.fn();
    const { next, save } = canUndo({ apply });
    const state1 = Map({ foo: 'foo' });
    save( state1 );
    next();
    expect( apply ).not.toHaveBeenCalled();
  });

  test( 'applies next state when it exists', () => {
    const apply = jest.fn();
    const { next, prev, save } = canUndo({ apply });
    const state1 = Map({ foo: 'foo' });
    const state2 = Map({ foo: 'bar' });
    save( state1 );
    save( state2 );
    prev();
    next();
    expect( apply ).toHaveBeenCalledTimes( 2 );
    expect( apply ).toHaveBeenLastCalledWith( state2 );
  });

  test( 'runs prev recursively when ignore path matches', () => {
    const apply = jest.fn();
    const undo = canUndo({ apply });
    const spy = jest.spyOn( undo, 'apply' );
    const state1 = Map({ foo: 'foo' });
    const state2 = Map({ foo: 'bar' });
    undo.save( state1 );
    undo.save( state2 );
    undo.prev();
    undo.next({ ignore: 'foo' });
    expect( spy ).toHaveBeenCalledTimes( 2 );
    expect( apply ).toHaveBeenCalledTimes( 1 );
    expect( apply ).toHaveBeenCalledWith( state1 );
  });

  test( 'does not reset when not dirty', () => {
    const apply = jest.fn();
    const { reset } = canUndo({ apply });
    reset();
    expect( apply ).not.toHaveBeenCalled();
  });

  test( 'resets when dirty', () => {
    const apply = jest.fn();
    const { reset, save, prev } = canUndo({ apply });
    const state1 = Map({ foo: 'foo' });
    const state2 = Map({ foo: 'bar' });
    save( state1 );
    save( state2 );
    prev();
    reset();
    expect( apply ).toHaveBeenCalledTimes( 2 );
    expect( apply ).toHaveBeenLastCalledWith( state2, { reset: true } );
  });
});

describe( 'store / public', () => {
  test( 'invokes subscriptions on state set', () => {
    const invoke = jest.fn();
    const subscriptionInit = () => ({ ...store.offersSubscription(), invoke });
    const storeMethods = store.initStore({ subscriptionInit });
    const key = 'foo';
    const val = 'bar';
    storeMethods.setState( key, val );
    expect( invoke.mock.calls[0][0] ).toEqual( Map({ [key]: val }) );
  });

  test( 'saves undo on state set', () => {
    const save = jest.fn();
    const undoInit = () => ({ ...store.canUndo(), save });
    const storeMethods = store.initStore({ undoInit });
    const key = 'foo';
    const val = 'bar';
    storeMethods.setState( key, val );
    expect( save.mock.calls[0][0] ).toEqual( Map({ [key]: val }) );
  });

  test( 'resets undo when dirty', () => {
    const isDirty = jest.fn(() => true);
    const reset = jest.fn();
    const undoInit = () => ({ ...store.canUndo(), isDirty, reset });
    const storeMethods = store.initStore({ undoInit });
    const key = 'foo';
    const val = 'bar';
    storeMethods.setState( key, val );
    expect( reset ).toHaveBeenCalledTimes( 1 );
  });

  test( 'can set state quietly without invoking subscriptions', () => {
    const invoke = jest.fn();
    const undoInit = () => ({ ...store.canUndo(), invoke });
    const storeMethods = store.initStore({ undoInit });
    const key = 'foo';
    const val = 'bar';
    const expected = Map({ [key]: val });
    const actual = storeMethods.setStateQuiet( key, val );
    expect( expected ).toEqual( actual );
    expect( invoke ).not.toHaveBeenCalled();
  });

  test( 'subscribes to branches of state', () => {
    const cb = jest.fn();
    const storeMethods = store.initStore();
    const key = 'foo';
    const val = 'bar';
    const val2 = 'baz';
    storeMethods.subscribeTo( key, cb );
    storeMethods.setState( key, val );
    storeMethods.setState( key, val2 );
    expect( cb ).toHaveBeenCalledTimes( 2 );
    expect( cb ).toHaveBeenLastCalledWith( val2 );
  });

  test( 'does not invoke callback when subsequent sets are duplicates', () => {
    const cb = jest.fn();
    const storeMethods = store.initStore();
    const key = 'foo';
    const val = 'bar';
    storeMethods.subscribeTo( key, cb );
    storeMethods.setState( key, val );
    storeMethods.setState( key, val );
    expect( cb ).toHaveBeenCalledTimes( 1 );
    expect( cb ).toHaveBeenCalledWith( val );
  });

  test( 'sets initial state when present', () => {
    const cb = jest.fn();
    const storeMethods = store.initStore();
    const key = 'foo';
    const initialState = { bar: 'bar' };
    storeMethods.subscribeTo( key, cb, initialState );
    const expected = Map( initialState );
    const actual = storeMethods.getState( key );
    expect( expected ).toEqual( actual );
  });

  test( 'subscribes to nested state', () => {
    const cb = jest.fn();
    const storeMethods = store.initStore();
    const key = [ 'foo', 'bar' ];
    const val = 'baz';
    storeMethods.subscribeTo( key, cb );
    storeMethods.setState( key, val );
    expect( cb ).toHaveBeenCalledTimes( 1 );
    expect( cb ).toHaveBeenCalledWith( val );
  });

  test( 'unsubscribes', () => {
    const cb = jest.fn();
    const storeMethods = store.initStore();
    const key = 'foo';
    const val = 'bar';
    const val2 = 'baz';
    const sub = storeMethods.subscribeTo( key, cb );
    storeMethods.setState( key, val );
    storeMethods.unsubscribe( sub );
    storeMethods.setState( key, val2 );
    expect( cb ).toHaveBeenCalledTimes( 1 );
    expect( cb ).toHaveBeenCalledWith( val );
  });

  test( 'clears state', () => {
    const storeMethods = store.initStore();
    const key = 'foo';
    const val = 'bar';
    storeMethods.setState( key, val );
    storeMethods.clearState();
    const expected = Map({});
    const actual = storeMethods.getState();
    expect( expected ).toEqual( actual );
  });
});

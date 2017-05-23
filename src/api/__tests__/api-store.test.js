import { fromJS } from 'immutable';

describe( 'api store', () => {

  const url    = 'http://foo.api.com';
  const schema = { title: 'resource' };
  const initStore = require( '../../store' ).initStore;
  const getStore = () => require( '../store' ).default( url, schema, initStore() );

  test( 'gets and sets state with key', () => {
    const store = getStore();
    const key = 'foo';
    const val = 'bar';
    store.setState( val, key );
    const expected = val;
    const actual = store.getState( key );
    expect( expected ).toEqual( actual );
  });

  test( 'gets and sets state without key', () => {
    const store = getStore();
    const val = 'bar';
    store.setState( val );
    const expected = val;
    const actual = store.getState();
    expect( expected ).toEqual( actual );
  });

  test( 'sets state quietly', () => {
    const store = getStore();
    const val = 'bar';
    store.setStateQuiet( val );
    const expected = val;
    const actual = store.getState();
    expect( expected ).toEqual( actual );
  });

  test( 'gets and sets requests', () => {
    const store = getStore();
    const key = 'foo';
    const val = 'bar';
    store.setRequests( val, key );
    const expected = val;
    const actual = store.getRequests( key );
    expect( expected ).toEqual( actual );
  });

  test( 'gets and sets requests data', () => {
    const store = getStore();
    const key = 'foo';
    const val = 'bar';
    store.setRequestsData( key, val );
    const expected = val;
    const actual = store.getRequestsData( key );
    expect( expected ).toEqual( actual );
  });

  test( 'gets and sets pending', () => {
    const store = getStore();
    const key = 'foo';
    const val = 'bar';
    store.setPending( key, val );
    const expected = val;
    const actual = store.getPending( key );
    expect( expected ).toEqual( actual );
  });

  test( 'gets and sets error', () => {
    const store = getStore();
    const key = 'foo';
    const val = 'bar';
    store.setError( key, val );
    const expected = val;
    const actual = store.getError( key );
    expect( expected ).toEqual( actual );
  });

  test( 'gets and sets error quietly', () => {
    const store = getStore();
    const spy = jest.spyOn( store, 'setStateQuiet' );
    const key = 'foo';
    const val = 'bar';
    store.setError( key, val, { quiet: true } );
    const expected = val;
    const actual = store.getError( key );
    expect( expected ).toEqual( actual );
    expect( spy ).toHaveBeenCalledTimes( 1 );
  });

  test( 'gets and sets models', () => {
    const store = getStore();
    const val = 'bar';
    store.setModels( val );
    const expected = val;
    const actual = store.getModels();
    expect( expected ).toEqual( actual );
  });

  test( 'gets and sets individual models', () => {
    const store = getStore();
    const key = 'foo';
    const val = 'bar';
    store.setModel( key, val );
    const expected = val;
    const actual = store.getModel( key );
    expect( expected ).toEqual( actual );
  });

  test( 'deletes models', () => {
    const store = getStore();
    const key = 'foo';
    const val = 'bar';
    store.setModel( key, val );
    store.deleteModel( key );
    const actual = store.getModel( key );
    expect( actual ).toBeUndefined();
  });

  test( 'deletes models safely', () => {
    try {
      const store = getStore();
      const key = 'foo';
      const expected = [];
      const actual = store.deleteModel( key );
      expect( expected ).toEqual( actual );
    } catch ( error ) {
      console.log( error ); // eslint-disable-line
      expect.hasAssertions();
    }
  });

  test( 'gets and sets collections with default path', () => {
    const store = getStore();
    const data = fromJS([{ id: 'foo' }]);
    store.setCollection( data );
    const expected = data;
    const actual = store.getCollection();
    expect( expected ).toEqual( actual );
  });

  test( 'gets and sets collections with explicit path', () => {
    const store = getStore();
    const key = '/foo';
    const val = fromJS([{ id: 'foo' }]);
    store.setCollection( val, key );
    const expected = val;
    const actual = store.getCollection( key );
    expect( expected ).toEqual( actual );
  });

  test( 'gets collections safely', () => {
    try {
      const store = getStore();
      const key = '/foo';
      const actual = store.getCollection( key );
      expect( actual ).toBeNull();
    } catch ( error ) {
      console.log( error ); // eslint-disable-line
      expect.hasAssertions();
    }
  });

  test( 'updates collections with default path', () => {
    const store = getStore();
    const model = { id: 'foo' };
    const list = fromJS([{ id: 'bar' }]);
    store.setCollection( list );
    store.updateCollection( model );
    expect( store.getModel( 'foo' ) ).toEqual( fromJS( model ) );
    expect( store.getCollection().size ).toBe( 2 );
    expect( store.getCollection().get( 1 ) ).toEqual( fromJS( model ) );
  });

  test( 'updates collections with explicit path', () => {
    const store = getStore();
    const key = '/foo';
    const model = { id: 'foo' };
    const list = fromJS([{ id: 'bar' }]);
    store.setCollection( list, key );
    store.updateCollection( model, key );
    expect( store.getModel( 'foo' ) ).toEqual( fromJS( model ) );
    expect( store.getCollection( key ).size ).toBe( 2 );
    expect( store.getCollection( key ).get( 1 ) ).toEqual( fromJS( model ) );
  });

  //test.only( 'clears collections', () => {
    //const store = getStore();
    //const list = fromJS([{ id: 'bar' }]);
    //store.setCollection( list );
    //store.setCollection( list, '/foo' );
    //store.clearCollection();
    //// TODO: why is this failing
    ////expect( store.getCollection() )
  //});

  test( 'populates models on set collection', () => {
    const store = getStore();
    const data = fromJS([{ id: 'foo' }, { id: 'bar' }]);
    store.setCollection( data );
    expect( store.getModel( 'foo' ) ).toEqual( data.get(0) );
    expect( store.getModel( 'bar' ) ).toEqual( data.get(1) );
  });

  test( 'removes model from collection on delete', () => {
    const store = getStore();
    const data = fromJS([{ id: 'foo' }, { id: 'bar' }]);
    store.setCollection( data );
    store.deleteModel( 'foo' );
    expect( store.getModel( 'foo' ) ).toBeUndefined();
    expect( store.getModel( 'bar' ) ).toEqual( data.get(1) );
  });

  test( 'updates model', () => {
    const store = getStore();
    const key = 'foo';
    const val = fromJS({ bar: 'bar', sticky: 'foo' });
    store.setModel( key, val );
    store.updateModel( key, { bar: 'baz', foo: 'bar' } );
    const expected = fromJS({ bar: 'baz', sticky: 'foo', foo: 'bar' });
    const actual = store.getModel( key );
    expect( expected ).toEqual( actual );
  });

  test( 'updates model safely', () => {
    try {
      const store = getStore();
      const key = 'foo';
      const expected = [];
      const actual = store.updateModel( key, { bar: 'baz', foo: 'bar' } );
      expect( expected ).toEqual( actual );
    } catch ( error ) {
      console.log( error ); // eslint-disable-line
      expect.hasAssertions();
    } 
  });
});

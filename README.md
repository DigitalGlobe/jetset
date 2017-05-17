<p align="center">
  <a href="https://github.com/DigitalGlobe/jetset"><img src="https://cdn.rawgit.com/DigitalGlobe/jetset/074ede86/examples/public/jetset.png?raw=true" /></a>
</p>

[![npm version](https://badge.fury.io/js/jetset.svg)](https://badge.fury.io/js/jetset)
[![dependencies](https://david-dm.org/DigitalGlobe/jetset.svg)](https://david-dm.org/DigitalGlobe/jetset.svg)

# Jetset
> RESTful API fetching and caching for React apps, backed by an immutable state tree

Stop re-solving the problems of fetching, caching, and managing state for your
RESTful API, so you can focus on your React app's unique needs.

:sparkles: Advantages of jetset include:

* Automatic translation of routes into intuitive methods that fetch and cache data smartly
* Optimistic UI updates by default (with option to turn them off)
* Zero-config for standard RESTful routes + simple overrides for
  non-standard routes
* [Immutable](https://github.com/facebook/immutable-js/) state tree guarantees no bugs from unexpected mutations
* **Time travel debugging** included with jetset devtools!
* Abstract away your API implementation details. If your api changes your code
  doesn't need to.
* Server-side support (uses [isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch<Paste>) behind the scenes)
* [*In progress*] Use [JSON schemas](http://json-schema.org/) to express
  attributes of and relationships between your api models, allowing for even smarter
  caching, reduction of fetches, type checking, and runtime safety warnings.

This last one will provide some of the value of GraphQL + Relay without all the dependencies and complex set-up.

## Install

```
$ npm i --save jetset
```

## Use

Note that jetset uses mostly [Immutable](https://github.com/facebook/immutable-js/) data structures - primarily [List](http://facebook.github.io/immutable-js/docs/#/List) and [Map](http://facebook.github.io/immutable-js/docs/#/Map).

See the [docs](docs/index.md) for complete documentation/reference.

To get started just specify your base url and route(s) as props on the Api component.

### Quick start

```jsx
import React from 'react';
import Api from 'jetset/api';

const MyApi = Component =>
  <Api url="https://my.api.com" myResource="/my_resource">
    <Component />
  </Api>

export default MyApi( props =>
  <div>
    { props.myResource.$list().map( item =>
      <div>{ item.get( 'title' ) }</div>
    )}
  </div>
)
```

#### More complete example:

```jsx
export default MyApi(({ myResource }) =>
  <div>

    // GET /my_resource
    { myResource.$list().map( item => (
      <div>
        <span>{ item.get( 'title' ) }</span>

        // PUT /my_resource/id
        <button onClick={() => item.$update({ title: 'renamed' }) }>Rename</button>

        // DELETE /my_resource/id
        <button onClick={ item.$delete }>Delete</button>

        // GET /my_resource/id
        <button onClick={() => myResource.$get( item.get( 'id' ) ) }>Get detail</button>
      </div>
    ))}

    // POST /my_resource
    <button onClick={() => myResource.$create({ title: 'foo' }) }>Create new item</button>
  </div>
)
```
#### Example with jetset helpers

This example shows off conditional rendering based on the status of underlying fetches, and the simplicity of search/pagination using jetset.

```jsx
class MyComponent extends React.Component {

  constructor() {
    super();
    this.state = {
      limit: 30,
      offset: 0
    }
  }
  
  onPrev = () =>
    this.setState( state => ({ offset: state.offset - state.limit }) )
    
  onNext = () =>
    this.setState( state => ({ offset: state.offset + state.limit }) )
  
  render() {
    const list = this.props.myResource.$list( this.state ); // e.g. GET /my_resource?limit=30&offset=0 (cached)
    return (
    
      list.$isPending ?
        <span>Loading...</span>  
      : 
      list.$error ?
        <span>Error: {list.$error.message}</span>
      :
      <div>
        { list.map( item => <div>{ item.get( 'title' ) }</div> ) }
        <button onClick={ this.onPrev }>Prev</button>
        <button onClick={ this.onNext }>Next</button>
      </div>
    )
  }
}
```

## Documentation

See the [docs](docs/index.md) for complete documentation/reference.

## Examples

Note: Examples are not yet fully usable outside of DigitalGlobe, but they're
still worth running in order to see example code.

1. Clone this repo

1. `npm i`

1. `npm start`

1. Go to http://localhost:8080 (or whatever port you can see assigned in the console)

Source code is available in src/examples.

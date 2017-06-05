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
      <div>{ item.title }</div>
    )}
  </div>
)
```

#### More complete example:

```jsx
export default MyApi(({ myResource }) =>
  <div>

    { /* GET /my_resource */ }
    { myResource.$list().map( item => (
      <div>
        <span>{ item.title }</span>

        { /* PUT /my_resource/id */ }
        <button onClick={() => item.$update({ title: 'renamed' }) }>Rename</button>

        { /* DELETE /my_resource/id */ }
        <button onClick={ item.$delete }>Delete</button>

        { /* GET /my_resource/id */ }
        <button onClick={() => myResource.$get( item.id }>Get detail</button>
      </div>
    ))}

    { /* POST /my_resource */ }
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
        { list.map( item => <div>{ item.title }</div> ) }
        <button onClick={ this.onPrev }>Prev</button>
        <button onClick={ this.onNext }>Next</button>
      </div>
    )
  }
}
```

## Documentation

See the [docs](docs/index.md) for complete documentation/reference.

## Should I use this or Redux or both?

JetSet at its core is meant to replace all fetching, caching, and state management related to working with RESTful apis. You could use it on its own or in conjunction with a framework like Redux.

Since JetSet is backed by an immutable state tree we've created some tools that you can use to leverage that tree - `globalState`, `localState`, etc. (see examples) - but those are auxiliary, meant to be used if you're not already using a framework like Redux but you want something beyond React's component state tools, and/or you want to use time-travel debugging.

Our opinionated general guidelines are:

- Use JetSet for an application of any size if you're working with a RESTful api.
- If your application is nothing more than a widget just use React's state tools for the rest of your state management.
- If your application is desktop scale but not complex, use JetSet's state tools.
- If your application is complex you should use an actual framework like Redux. But you can still use JetSet to handle all your api interactions.

## Examples

1. Clone this repo

1. `npm i`

1. `npm start`

1. Go to http://localhost:8080 (or whatever port you can see assigned in the console)

Source code is available in /examples.

## Test

```
$ npm install && npm test
```

<p align="center">
  <a href="https://github.com/DigitalGlobe/jetset"><img src="https://cdn.rawgit.com/DigitalGlobe/jetset/074ede86/examples/public/jetset.png?raw=true" /></a>
</p>

[![npm version](https://badge.fury.io/js/jetset.svg)](https://badge.fury.io/js/jetset)
[![dependencies](https://david-dm.org/DigitalGlobe/jetset.svg)](https://david-dm.org/DigitalGlobe/jetset.svg)

# Jetset
> RESTful API fetching and caching for React apps, backed by an immutable state tree

Stop re-solving the problems of fetching, caching, and managing state for your
RESTful API, so you can focus on your React app's unique needs.

Advantages of jetset include:

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

  This last one is meant to provide some of the value of GraphQL + Relay
  without all the dependencies and complex set-up.

## Install

```
$ npm i --save jetset
```

## Use

Specify your base url and route(s) as props on the Api component

### Quick start

```jsx
import React from 'react';
import Api from 'jetset/api';

const MyApi = Component =>
  <Api url="https://somehost.com/api" myResource="/my_resource">
    <Component />
  </Api>

export default MyApi(({ myResource }) =>
  <div>
    { myResource.$list().map( item =>
      <div>{ item.get( 'title' ) }</div>
    )}
  </div>
)
```

#### More complete example:

```jsx
export default MyApi(({ myResource }) =>
  <div>

    {/* GET /my_resource */}
    { myResource.$list().map( item => (
      <div>
        <span>{ item.get( 'title' ) }</span>

        {/* PUT /my_resource/id */}
        <button onClick={() => item.$update({ title: 'renamed' }) }>Rename</button>

        {/* DELETE /my_resource/id */}
        <button onClick={ item.$delete }>Delete</button>

        {/* GET /my_resource/id */}
        <button onClick={() => myResource.$get( item.get( 'id' ) ) }
      </div>
    ))}

    {/* POST /my_resource */}
    <button onClick={() => myResource.$create({ title: 'foo' }) }>Create new item</button>
  </div>
)
```

### Props

```javascript
type ApiProps = {

  // REQUIRED

  // protocol, host, path to api - e.g. 'https://my.api.com/v2'
  url: string,

  // one or more resource configs - e.g. '/my_resource' or a route config (see below)
  [path: string]: string | RouteOverrides,

  // OPTIONAL

  // For cookies, cors, etc. see https://github.com/github/fetch#sending-cookies
  credentials?: 'include' | 'same-origin',

  // Set an Authorization header - e.g. "Bearer <some-token-here>"
  authorization?: string,

  // If you need to process api responses before caching/returning (otherwise the
  // whole response is expected to be an array for collection routes or an object
  // for model routes)
  getData(response: Array<Object> | Object) => Array<Object> | Object
}

<Api { ...apiProps }>
```

#### Overriding default routes, methods, etc.

When you pass in a string as the value of your resource, all routes are inferred according to REST standards.
If you need to override one or more of those routes, you can pass in an object instead of a string, including 
a `routes` object with as many overrides as you need.

For example:

```javascript

type RouteConfig = {
  method: 'get' | 'post' | 'put' | 'delete',
  route: string,
  getData?: (response: Array<Object> | Object) => Array<Object> | Object
}

type RouteOverrides = {

  default: string, // e.g. '/my_resource'

  // one or more optional overrides
  create?: (payload: Object)                    => string | RouteConfig,
  list?:   (params?: Object)                    => string | RouteConfig,
  search?: (params?: Object)                    => string | RouteConfig,
  get?:    (id: number|string)                  => string | RouteConfig,
  update?: (id: number|string, payload: Object) => string | RouteConfig,
  delete?: (id: number|string)                  => string | RouteConfig
}

<Api url="http://my.api.com" myResource={{ routes }}>...</Api>
```

Note that these keys match their equivalent `$create`, `$update`, etc. methods.

### Docs / Reference

Assuming this as a starting point:

```javascript
const { resource } = props; // e.g. from <Api url="..." resource="/resource" />
```

method|route|jetset fn|returns|uses cache
------|-----|---------|-------|----------
GET|/resource|`resource.$list()`|[List](http://facebook.github.io/immutable-js/docs/#/List)|yes
GET|/resource?foo=bar|`resource.$list({foo: 'bar'})`|[List](http://facebook.github.io/immutable-js/docs/#/List)|yes
GET|/resource?foo=bar|`resource.$search({foo: 'bar'})`|Promise<Array>|results are cached (see below)
|||`resource.$search.results({foo: 'bar'})`|[List](http://facebook.github.io/immutable-js/docs/#/List)|yes
POST|/resource|`resource.$create({foo: 'bar'})`|Promise<Object>|results are cached
GET|/resource/id|`resource.$get(id)`|[Map](http://facebook.github.io/immutable-js/docs/#/Map)|yes
PUT|/resource/id|`resource.$get(id).$update({foo: 'bar'})`|Promise<Object>|results are cached
PUT|/resource/id|`resource.$list().get(index).$update({foo: 'bar'})`|Promise<Object>|results are cached
DELETE|/resource/id|`resource.$get( id ).$delete()`|Promise<Object>|results are cached
DELETE|/resource/id|`resource.$list().get(index).$delete()`|Promise<Object>|results are cached
GET|/resource/some/route|`resource.api.get('/some/route')`|Promise<any>|no
GET|/resource/some/route|`resource.api.$get('/some/route')`|[List](http://facebook.github.io/immutable-js/docs/#/List)|[Map](http://facebook.github.io/immutable-js/docs/#/Map)|yes
POST|/resource/some/route|`resource.api.post('/some/route')`|Promise<any>|no
PUT|/resource/some/route|`resource.api.put('/some/route')`|Promise<any>|no
DELETE|/resource/some/route|`resource.api.delete('/some/route')`|Promise<any>|no

##### Helper methods and properties

jetset fn|returns|description
---------|-------|-----------
**$isPending**||Pending status of underlying fetches
`resource.$list().$isPending`|Boolean \| void|Check to see if collection fetch is pending
`resource.$get(id).$isPending`|Boolean \| void|Check to see if model fetch is pending
**$error**||Error response for a given request
`resource.$list().$error`|Error \| void|Check to see if underlying collection fetch resulted in an error
`resource.$get(id).$error`|Error \| void|Check to see if underlying model fetch resulted in an error
**$clear()**||Clear caches
`resource.$clear()`|void|Clear the cache for `$list()`
`resource.$get( id ).$clear()`|void|Clear the cache for `$get()`
`resource.$search.results({...}).$clear()`|void|Clear the cache for `$search.results()`
`resource.$clearAll()`|void|Clear all cache for the given resource
**$reset()**||Reset cache with data from server
`resource.$reset()`|void|Refetch and rehydrate `$list()`
`resource.$get(id).$reset()`|void|Refetch and rehydrate `$get(id)`
`resource.$search.results({...}).$reset()`|void|Refetch and rehydrate search results

#### Optimism and pessimism

By default, deletes and updates are optimistic. To turn this off, pass
`{ optimistic: false }` in as an option. For example:

```javascript
sources.$get( id ).$delete({ optimistic: false })
sources.$get( id ).$update({ title: 'foo' }, { optimistic: false })
```

There is experimental support for optimistic creates. In this case, pass
a function in as the value of `optimistic`. This function will receive as
arguments the current state and the data payload you are about to post. For
example:

```javascript
sources.$create({ title: 'foo' }, { optimistic: ( state, data ) => {
  state.setIn([ 'models', 'fooId' ], Map({ ...data, _id: 'fooId' }));
}})
```


#### Devtools

There are some very preliminary dev tools available by doing this:

```javascript
import TreeViewer from 'jetset/tree_viewer';

function MyComponent() {
  return (
    <div>
      <TreeViewer /> {/* can literally be anywhere, but somewhere at root is probably best */}
      <Anything />
    </div>
  );
}
```

Then in Chrome console you can do:

```
jetset.toggleDevTools()
```

Better stuff coming soon!


## Examples

Note: Examples currently assume timbr-omni is running with the api-lib-poc branch checked out.

1. Clone this repo

1. `npm i`

1. `npm start`

1. Go to http://localhost:8080 (or whatever port you can see assigned in the console)

Source code is available in src/examples.

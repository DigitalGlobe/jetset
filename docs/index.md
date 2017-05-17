# Documentation

- [Props](#props)
  - [Overriding routes, methods, etc.](#overriding-default-routes-methods-etc)
- [Reference](#reference)
  - [Helper methods and properties](#helper-methods-and-properties)
  - [Cache management helpers](#cache-management-helpers)
- [Optimism and pessimism](#optimism-and-pessimism)
- [Devtools](#devtools)


## Props

```javascript
type ApiProps = {

  /* REQUIRED */

  // protocol, host, path to api - e.g. 'https://my.api.com/v2'
  url: string,

  // one or more resource configs - e.g. '/my_resource' or a route config (see below)
  [path: string]: string | RouteOverrides,

  /* OPTIONAL */

  // For cookies, cors, etc. (see https://github.com/github/fetch#sending-cookies)
  credentials?: 'include' | 'same-origin',

  // Set an Authorization header - e.g. "Bearer <some-token-here>"
  authorization?: string,

  // If you need to process api responses before caching/returning (otherwise the
  // whole response is expected to be an array for collection routes or an object
  // for model routes)
  getData(response: Array<Object> | Object) => Array<Object> | Object
}
```

For example:

```jsx
<Api
  url             = "http://my.api.com/v1"
  credentials     = "include"
  authorization   = "Bearer <some-token>"
  getData         = { response => response.data }
  myResource      = "/my_resource"
  myOtherResource = "/my_other_resource"
>
```

### Overriding default routes, methods, etc.

When you pass in a string as the value of your resource, all routes are inferred according to REST standards.

If you need to override one or more of those routes, you can pass in an object instead of a string, including 
a `routes` object with as many overrides as you need.

```javascript

type RouteConfig = {
  method?:  'get' | 'post' | 'put' | 'delete',
  route?:   string,
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
```

For example:

```jsx
const myResourceConfig = {
  default: '/my_resource',
  get:     id => `/my_resource/${id}/view`,
  search:  () => ({ method: 'post', route: '/search' }),
  update:  () => ({ method: 'post' })
}

<Api myResource={{ routes: myResourceConfig }} ... >
```

Note that these keys match their equivalent `$get`, `$search`, `$update`, etc. methods.

## Reference

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

## Helper methods and properties

jetset fn|returns|description
---------|-------|-----------
**$isPending**||Pending status of underlying fetches
`resource.$list().$isPending`|Boolean \| void|Check to see if collection fetch is pending
`resource.$get(id).$isPending`|Boolean \| void|Check to see if model fetch is pending
**$error**||Error response for a given request
`resource.$list().$error`|Error \| void|Check to see if underlying collection fetch resulted in an error
`resource.$get(id).$error`|Error \| void|Check to see if underlying model fetch resulted in an error

### Cache management helpers

jetset fn|returns|description
---------|-------|-----------
**$clear()**||Clear caches
`resource.$clear()`|void|Clear the cache for `$list()`
`resource.$get( id ).$clear()`|void|Clear the cache for `$get()`
`resource.$search.results({...}).$clear()`|void|Clear the cache for `$search.results()`
`resource.$clearAll()`|void|Clear all cache for the given resource
**$reset()**||Reset cache with data from server
`resource.$reset()`|Promise<Array>|Refetch and rehydrate `$list()`
`resource.$get(id).$reset()`|Promise<Object>|Refetch and rehydrate `$get(id)`
`resource.$search.results({...}).$reset()`|Promise<Array>|Refetch and rehydrate search results

#### :boom: Nuclear option to clear 100% of jetset's cache:

```javascript
import store from 'jetset/store'
store.clearState()
```

## Optimism and pessimism

By default, `$delete()` and `$update(...)` are optimistic. To turn this off, pass
`{ optimistic: false }` in as an option. For example:

```javascript
myResource.$get( id ).$delete({ optimistic: false })
myResource.$get( id ).$update({ title: 'foo' }, { optimistic: false })
```

There is experimental support for optimistic `$create(...)`. In this case, pass
a function in as the value of `optimistic`. This function will receive as
arguments the current state and the data payload you are about to post. For
example:

```javascript
myResource.$create({ title: 'foo' }, { optimistic: ( state, data ) => {
  state.setIn([ 'models', 'fooId' ], Map({ ...data, _id: 'fooId' }));
}})
```

Otherwise, `$create(...)` will call a refetch of `$list()` on success. To prevent this, pass `{ refetch: false }` as an option:

```javascript
myResource.$create({ title: 'foo' }, { refetch: false })
```

## Devtools

There are some very preliminary dev tools available, including time travel
debugging, by doing this:

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



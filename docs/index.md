# Documentation

- [Props](#props)
  - [Custom routes, methods, etc.](#custom-routes-methods-etc)
  - [Custom fetchers/methods](#custom-fetchers)
- [Reference](#reference)
  - [Helper methods and properties](#helper-methods-and-properties)
  - [Cache management helpers](#cache-management-helpers)
  - [Api Decorator](#api-decorator)
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
  getData?: (response: Array<Object> | Object) => Array<Object> | Object

  // You can pass a callback function for specific ways to handle errors.
  onError?: (error: <Object>) => // do whatever operation you need to here.eg // localStorage.removeItem('some_token')

  // Return immutable data structures (List and Map) instead of Array and Object
  immutable?: boolean
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
  onError         = { error => console.log( 'mycustomerror: ', error )}
>
```

### Custom routes, methods, etc.

When you pass in a string as the value of your resource, all routes are inferred according to REST standards.

If you need to override one or more of those routes, you can pass in an object instead of a string, including
a `routes` object with as many overrides as you need.

```javascript

type RouteConfig = {
  method?:  'get' | 'post' | 'put' | 'delete',
  route?:   string | (config) object
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
  update:  () => ({ method: 'post' }),
  onError: (error) => // do something on error with single route
}

<Api myResource={{ routes: myResourceConfig }} ... >
```

Note that these keys match their equivalent `$get`, `$search`, `$update`, etc. methods.

#### Custom fetchers

Sometimes you may want to add a custom method to your resource on top of the
standard REST calls. For example:

```jsx
const routes = {
  default: '/users',
  onError: error => localStorage.removeItem('some_cookie')
  getUserAlbums: id => ({ method: 'get', route: `/users/${id}/albums`, usesCache: true })
}

<Api ... users={{ routes }}>
```

Then...

```jsx
const userAlbums = this.props.users.$getUserAlbums( 1 )

userAlbums.map( album => <div>{ album.title }</div> )
```

Note that `usesCache` causes the method to return data instead of a promise. If
you omit this key or set it to false, no cache will be used and it will return
a promise instead.

##### Type reference for custom fetchers

```javascript
type CustomFetcherConfig = {
  route:      string, // absolute path, not relative to default route
  method:     'get' | 'post' | 'put' | 'delete', // defaults to get
  body?:      Object, // params to post or put
  usesCache?: boolean
}

const routes = {
  [key: string]: (args: any) => CustomFetcherConfig
}
```


## Reference

Assuming this as a starting point:

```javascript
const { resource } = props; // e.g. from <Api url="..." resource="/resource" />
```

method|route|jetset fn|returns|uses cache
------|-----|---------|-------|----------
GET|/resource|`resource.$list()`|Array|yes
GET|/resource?foo=bar|`resource.$list({foo: 'bar'})`|Array|yes
GET|/resource?foo=bar|`resource.$search({foo: 'bar'})`|Promise<Array>|results are cached (see below)
|||`resource.$search.results({foo: 'bar'})`|Array|yes
POST|/resource|`resource.$create({foo: 'bar'})`|Promise<Object>|results are cached
GET|/resource/id|`resource.$get(id)`|Object|yes
PUT|/resource/id|`resource.$get(id).$update({foo: 'bar'})`|Promise<Object>|results are cached
PUT|/resource/id|`resource.$list().get(index).$update({foo: 'bar'})`|Promise<Object>|results are cached
DELETE|/resource/id|`resource.$get( id ).$delete()`|Promise<Object>|results are cached
DELETE|/resource/id|`resource.$list().get(index).$delete()`|Promise<Object>|results are cached
GET|/resource/some/route|`resource.api.get('/some/route')`|Promise<any>|no
GET|/resource/some/route|`resource.api.$get('/some/route')`|Array \| Object|yes
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
`resource.$list().$reset()`|Promise<Array>|Refetch and rehydrate `$list()`
`resource.$get(id).$reset()`|Promise<Object>|Refetch and rehydrate `$get(id)`
`resource.$get( id, { reset: true } )`|Object (empty placeholder)|Force fresh fetch of data and rehydrate cache
`resource.$search.results({...}).$reset()`|Promise<Array>|Refetch and rehydrate search results

#### :boom: Nuclear option to clear 100% of jetset's cache:

```javascript
import { store } from 'jetset'
store.clearState()
```
## Api decorator

You can facilitate binding components to api resources with the api decorator.
For example:

```javascript
import { apiDecorator } from 'jetset'

const users = apiDecorator({ url: 'http://my.api.com', users: '/users' });

@users
class NeedsUsers extends React.Component {
  someMethod() {
    this.props.users.$list() // or whatever
  }
}
```

Or for a whole api:

```javascript
import { apiDecorator } from 'jetset'

const api = apiDecorator({
  url: 'http://my.api.com',
  users: '/users',
  posts: '/posts'
})

@api
class NeedsUsers extends React.Component {
  someMethod() {
    this.props.users.$list() // or whatever
    this.props.posts.$list() // or whatever
  }
}
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
import { TreeViewer } from 'jetset';

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

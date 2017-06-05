# Changelog

### 0.4.21

- Deep clone empty list and map placeholders

### 0.4.19-20

- Allow for basic use of $list with arrays of scalar values

### 0.4.18

- Clone placeholders instead of force clearing pending flags

### 0.4.16-17

- Force clear pending flag in cases where empty arrays are returned, because of
  as yet unclear prototype-overwriting type issue when setting placeholders

### 0.4.11-15

- Safe cloning/children experimentation

### 0.4.10

- Better pattern and documentation for api decorator

### 0.4.9

- Better debugging name for api decorator 

### 0.4.8

- Add decorator helper that accepts Api props as argument and can then
  decorate components and other decorators. For example:

  ```javascript
  import apiDecorator from 'jetset/lib/decorator'

  const users = apiDecorator({ url: 'http://my.api.com', users: '/users' })

  @users
  class NeedsUsers extends React.Component {
    someMethod() {
      this.props.users.$list() // or whatever
    }
  }
  ```

### 0.4.7

- Fix getData for optimistic update and elsewhere

### 0.4.6

- Fix getData regression for string configs and $search handler

### 0.4.5

- Add es + umd builds.
- Add store tests.

### 0.4.4

- Clone root state object in subscribe's get() to ensure comparability

### 0.4.3

- Remove old api.js build artifact that was causing problems when requiring
  jetset/api

### 0.4.2

- Fix custom fetcher regression

### 0.4.1

- Allow for passing `{ reset: true }` as an option into `$get()` and `$list()`
  as an easy way to guarantee a reset of cache without testing sizes etc. For
  example:

```javascript
// force data to be refetched every time this component mounts
componentWillMount() {
  this.props.users.$get( 1, { reset: true } )
}
```


### 0.4.0

- Add option for specifying custom methods as well as routes. For example:

```jsx
const routes = {
  default: '/users',
  getUserAlbums: id => ({ method: 'get', route: `/users/${id}/albums`, usesCache: true })
}

<Api ... users={{ routes }}>

// then...

const userAlbums = this.props.users.$getUserAlbums( 1 )

userAlbums.map( album => <div>{ album.get( 'title' ) }</div> )
```

### 0.3.4

- When subscribing, use replace instead of merge on arrays since mergeDeep
  won't work with arrays

### 0.3.3

- Fix $clear and $reset for collections

### 0.3.2

- Add { refetch: false } as option for $create to avoid a full refetch unless
  actually desired
- Fix removeFromCollection regression
- Add nuclear clearState() option like so:

```javascript
import store from 'jetset/store';
store.clearState();
```

### 0.3.1

- Make sure id is stringified for delete

### 0.3.0

- Allow for passing in `myResource="/my_resource"` prop instead of a json schema,
  saving schemas only for more complex relationships and/or setting up an api
  on both server and client-side
- Add `getData` method as an option on individual routes
- Make all route config properties optional to selectively override just
  method, route, getData, etc.
- Better documentation

### 0.2.14

- Split out api store into separate module for easier maintenance and testing
- Fix $list route config after recent regression

### 0.2.13

- Fix route log reducer to not use first entry as start value

### 0.2.12

- Allow for method overrides per route

### 0.2.11

- Fix setSearchResults regression

### 0.2.10

- Pass params into routes.list() and routes.search()

### 0.2.9

- Allow for passing in optional `routes` config to selectively override
  default routes.

- Expose `props.localState` for setting/getting the more complete scope of
  local state

### 0.2.8

- Switch to `resource.$list()` as the primary list retrieval method instead of `resource()` (which also works for now)

### 0.2.7

- Make sure promise returned by `$search` resolves to full response

### 0.2.6

- Fix regression where placeholder was not being returned

### 0.2.5

- Fix fetch reference

### 0.2.4

- Update dependencies away from private repos so that jetset is fully open
  source.

### 0.2.3

- Add `props.<resource>.$clearAll()` method for nuclear cache clearing option

### 0.2.1/2

- Proper ignoring/building for npm

### 0.2.0

- Add option to pass a `route` param to `.$search()` in order to accommodate
  non-standard routes. For example:

  ```javascript
  // GET /users/search?query=foo&limit=10 => Promise<any>
  props.users.$search({ route: '/search', query: 'foo', limit: 10 })
  props.users.$search.results({ route: '/search', query: 'foo', limit: 10 })
  ```

- Add option to specify query params on the primary `resource()` call. For
  example:

  ```javascript
  // GET /users?limit=10 => List
  props.users({ limit: 10 })
  ```

- Try to pessimistically continue with `$update` and `$delete` even if the
  model has not been fetched yet. For example:

  ```javascript
  // GET /users/id => Map and in parallel...
  // PUT /users/id => Map
  props.users.$get( id ).$update({ foo: 'bar' })

  // GET /users/id => Map and in parallel...
  // DELETE /users/id => Map
  props.users.$get( id ).$delete({ foo: 'bar' })

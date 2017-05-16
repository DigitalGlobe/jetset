# Changelog

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

# Changelog

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

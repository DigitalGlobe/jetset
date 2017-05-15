'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = createActions;

var _immutable = require('immutable');

var _isoFetchStream = require('iso-fetch-stream');

var _isoFetchStream2 = _interopRequireDefault(_isoFetchStream);

var _schema = require('../lib/schema');

var _store = require('./store');

var _store2 = _interopRequireDefault(_store);

var _log = require('../lib/log');

var _query_string = require('../lib/query_string');

var _query_string2 = _interopRequireDefault(_query_string);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var methodDict = {
  create: 'post',
  list: 'get',
  get: 'get',
  update: 'put',
  delete: 'delete',
  search: 'get'
};

var logRoutes = function logRoutes(routes, resource, ns) {
  if (_config2.default.mode === 'development') {
    /* eslint-disable no-console */
    console.groupCollapsed('Rendering Api component for %c' + resource, 'color: green', 'with these routes');
    console.table(Object.keys(routes).reduce(function (memo, key) {
      var val = routes[key]('id', {});
      var def = typeof val === 'string' ? { method: methodDict[key], route: val } : val;
      var arg = key === 'get' ? 'id' : '';
      return Object.assign(memo, _defineProperty({}, key, Object.assign(def, _defineProperty({}, 'props.' + ns + '...', '$' + key + '(' + arg + ')'))));
    }, {}));
    console.groupEnd();
  }
};

function createActions(_ref) {
  var url = _ref.url,
      props = _objectWithoutProperties(_ref, ['url']);

  var fetchOptions = props.credentials ? { credentials: props.credentials } : {};
  if (props.auth || props.authorization) fetchOptions.headers = { Authorization: props.auth || props.authorization };
  var fetch = (0, _isoFetchStream2.default)(fetchOptions);

  return Object.keys(props).reduce(function (memo, key) {

    if ((0, _schema.isSchema)(props[key])) {

      var schema = props[key].schema || props[key];
      var getData = props[key].getData || function (data) {
        return data;
      };
      var idField = (0, _schema.getIdField)(schema);
      var resourceType = schema.title;
      var resourcePath = '/' + resourceType;
      var apiStore = (0, _store2.default)(url, schema);

      // TODO: use some more specific method from store's undo implementation
      var isUndo = function isUndo() {
        return apiStore._getState('_reset');
      };

      var routes = Object.assign({
        create: function create() {
          return { method: 'post', route: resourcePath };
        },
        list: function list() {
          return { method: 'get', route: resourcePath };
        },
        search: function search() {
          return { method: 'get', route: resourcePath };
        },
        get: function get(id) {
          return { method: 'get', route: resourcePath + '/' + id };
        },
        update: function update(id) {
          return { method: 'put', route: resourcePath + '/' + id };
        },
        delete: function _delete(id) {
          return { method: 'delete', route: resourcePath + '/' + id };
        }
      }, props[key].routes || {});

      logRoutes(routes, resourceType, key);

      var shouldFetch = function shouldFetch(path) {
        return !isUndo() && !apiStore.getPending(path) && !apiStore.getError(path);
      };

      var api = ['get', 'post', 'put', 'delete'].reduce(function (memo, method) {
        return _extends({}, memo, _defineProperty({}, method, function (path) {
          for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          apiStore.setPending(path, true);
          return fetch[method].apply(fetch, ['' + url + path].concat(args)).then(function (response) {
            var data = getData(response);
            apiStore.setPending(path, false);
            apiStore.setError(path, null, { quiet: true });
            return data;
          }, function (err) {
            apiStore.setPending(path, false);
            apiStore.setError(path, err);
            return Promise.reject(err);
          });
        }));
      }, {});

      var getRouteConfig = function getRouteConfig(config) {
        var defaultMethod = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'get';
        return typeof config === 'string' ? { method: defaultMethod, route: config } : { method: config.method.toLowerCase(), route: config.route };
      };

      /**
       * api calls
       */
      var fetchAll = function fetchAll(path) {
        var _getRouteConfig = getRouteConfig(routes.list()),
            defaultRoute = _getRouteConfig.route,
            method = _getRouteConfig.method;

        var route = path || defaultRoute;
        if (shouldFetch(route)) {
          api[method](route).then(function (data) {
            return apiStore.setCollection(data, route);
          });
        }
      };

      var fetchOne = function fetchOne(id) {
        var _getRouteConfig2 = getRouteConfig(routes.get(id)),
            route = _getRouteConfig2.route,
            method = _getRouteConfig2.method;

        if (shouldFetch(route)) {
          api[method](route).then(function (data) {
            return apiStore.setModel(data[idField], _extends({}, data, { _fetched: true }));
          });
        }
      };

      var createOne = function createOne(data) {
        var _getRouteConfig3 = getRouteConfig(routes.create(data), 'post'),
            route = _getRouteConfig3.route,
            method = _getRouteConfig3.method;

        return api[method](route, data).then(function (data) {
          fetchAll();
          return data;
        });
      };

      var updateOne = function updateOne(id, data) {
        var _getRouteConfig4 = getRouteConfig(routes.update(id, data), 'put'),
            route = _getRouteConfig4.route,
            method = _getRouteConfig4.method;

        return api[method](route, data);
      };

      var deleteOne = function deleteOne(id) {
        var _getRouteConfig5 = getRouteConfig(routes.delete(id), 'delete'),
            route = _getRouteConfig5.route,
            method = _getRouteConfig5.method;

        return api[method](route);
      };

      /**/

      var $clear = function $clear(id) {
        return function () {
          return apiStore.setModel(id, null);
        };
      };
      var $reset = function $reset(id) {
        return function () {
          return fetchOne(id);
        };
      };

      var optimisticDelete = function optimisticDelete(id) {
        var undoDelete = apiStore.deleteModel(id);
        if (undoDelete.length) {
          return deleteOne(id).catch(function (err) {
            (0, _log.logError)('Failed to delete ' + id, err);
            undoDelete.forEach(function (undo) {
              return undo();
            });
            return Promise.reject(err);
          });
        } else {
          return Promise.reject(new Error(404));
        }
      };

      var $delete = function $delete(id) {
        return function () {
          var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
          return options.optimistic === false || !apiStore.getModel(id) ? deleteOne(id).then(function () {
            return apiStore.deleteModel(id);
          }) : optimisticDelete(id);
        };
      };

      var optimisticUpdate = function optimisticUpdate(id, vals) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        var placeholder = typeof options.optimistic === 'function' ? options.optimistic(_extends({ id: id }, vals)) : vals;
        var undoUpdate = apiStore.updateModel(id, placeholder);
        if (undoUpdate.length) {
          return updateOne(id, vals).catch(function (err) {
            (0, _log.logError)('Failed to update ' + id + ' with vals', vals, err);
            undoUpdate.forEach(function (undo) {
              return undo();
            });
            return Promise.reject(err);
          });
        } else {
          return Promise.reject(new Error(404));
        }
      };

      var $update = function $update(id) {
        return function (vals) {
          var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
          return options.optimistic === false || !apiStore.getModel(id) ? updateOne(id, vals).then(function (data) {
            return apiStore.updateModel(id, data);
          }) : optimisticUpdate(id, vals, options);
        };
      };

      var getPlaceholder = function getPlaceholder() {
        var path = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        var dataType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _immutable.List;

        var placeholder = dataType();
        placeholder.$isPending = true;
        placeholder.$error = path ? apiStore.getError(path) : null;
        return placeholder;
      };

      var addRestMethods = function addRestMethods(model) {
        var id = model.get(idField);
        model.$delete = $delete(id);
        model.$update = $update(id);
        model.$clear = $clear(id);
        model.$reset = $reset(id);
        return model;
      };

      var $list = function $list(params) {
        var _getRouteConfig6 = getRouteConfig(routes.list(params)),
            route = _getRouteConfig6.route;

        var path = route + (params ? '?' + (0, _query_string2.default)(params) : '');
        var collection = apiStore.getCollection(path);
        if (!collection) {
          fetchAll(path);
          return getPlaceholder(path);
        } else {
          return collection.map(addRestMethods);
        }
      };

      var main = function main(params) {
        return $list(params);
      };

      main.$list = $list;

      main.$get = function (id) {
        var model = apiStore.getModel(id);
        if (!model || !model.get('_fetched')) {
          var path = routes.get(id);
          fetchOne(id);
          var placeholder = getPlaceholder(path, _immutable.Map);
          placeholder.$delete = $delete(id);
          placeholder.$update = $update(id);
          return placeholder;
        } else {
          return addRestMethods(model);
        }
      };

      // remove the cache for the resource collection
      main.$clear = function () {
        return apiStore.clearCollection();
      };
      main.$clearAll = apiStore.clearAll;
      main.$reset = fetchAll;

      var optimisticCreate = function optimisticCreate(data) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (typeof options.optimistic === 'function') {
          var nextState = apiStore.getState().withMutations(function (map) {
            return options.optimistic(map, data);
          });
          if (nextState) apiStore.setState(nextState);
          return createOne(data);
        } else {
          (0, _log.logWarn)('Optimistic creates must receive a function that updates the state with the optimistic data. The create will proceed pessimistically.');
          return createOne(data);
        }
      };

      main.$create = function (data) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        return !options.optimistic ? createOne(data) : optimisticCreate(data, options);
      };

      main.$search = function (params) {
        var _getRouteConfig7 = getRouteConfig(routes.search(params)),
            method = _getRouteConfig7.method,
            route = _getRouteConfig7.route;

        var fullRoute = method === 'get' ? route + ('?' + (0, _query_string2.default)(params)) : route;
        if (shouldFetch(fullRoute)) {
          var promise = method === 'get' ? api.get(fullRoute) : api[method](fullRoute, params);

          return promise.then(function (data) {
            apiStore.setCollection(data, fullRoute);
            return data;
          });
        }
        // TODO: store promise as pending value so it can be used on repeat
        // calls
        return Promise.resolve('pending');
      };

      main.$search.results = function (params) {
        var _getRouteConfig8 = getRouteConfig(routes.search(params)),
            route = _getRouteConfig8.route,
            method = _getRouteConfig8.method;

        var fullRoute = method === 'get' ? route + ('?' + (0, _query_string2.default)(params)) : route;
        var resultsCached = apiStore.getCollection(fullRoute);
        if (resultsCached) {
          return addRestMethods(resultsCached);
        } else {
          var placeholder = (0, _immutable.List)();
          placeholder.$isPending = !!apiStore.getPending(fullRoute);
          placeholder.$error = apiStore.getError(fullRoute);
          return placeholder;
        }
      };

      // hang standard api methods off of .api so devs can construct
      // non-standard paths
      main.api = ['delete', '$get', 'get', 'post', 'put', 'stream'].reduce(function (memo, method) {
        return _extends({}, memo, _defineProperty({}, method, function (path) {
          for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
          }

          var route = resourcePath + path;
          if (method === '$get') {
            var cache = apiStore.getRequestsData(route);
            if (cache) {
              return _immutable.List.isList(cache) ? apiStore.getCollection(route).map(addRestMethods) : cache;
            } else {
              if (shouldFetch(route)) {
                api.get.apply(api, [route].concat(args)).then(function (data) {
                  if (Array.isArray(data)) {
                    apiStore.setCollection(data, route);
                  } else {
                    apiStore.setRequestsData(route, data);
                  }
                  return data;
                });
              }
              return getPlaceholder(route);
            }
          } else {
            return api[method].apply(api, [route].concat(args));
          }
        }));
      }, {});

      main._schema = schema;
      main._resourceType = resourceType;
      main.getState = apiStore.getState;

      memo[key] = main;
      if (typeof window !== 'undefined') {
        window.jetset = window.jetset || {};
        window.jetset[key] = main;
      }
    }
    return memo;
  }, {});
}
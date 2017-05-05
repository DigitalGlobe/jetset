'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _class, _temp;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _immutable = require('immutable');

var _fetch = require('fetch');

var _fetch2 = _interopRequireDefault(_fetch);

var _schema = require('./lib/schema');

var _store = require('./store');

var _store2 = _interopRequireDefault(_store);

var _log = require('./lib/log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* basic state tree design for api.js
* {
*   $api: {
*     [url]: {
*       [resource]: {
*         models: {
*           [id]: { 
*             [key]: any,
*             _fetched?: boolean
*           }
*         },
*         requests: {
*           [url]: {
*             pending?: boolean,
*             error?: Object,
*             data?: List | Map
*           }
*         }
*       }
*     }
*   }
* }
*/

// TODO: use some more specific method from store's undo implementation
var isUndo = function isUndo() {
  return _store2.default.getState('_reset');
};

function createActions(props) {

  var fetchOptions = props.credentials ? { credentials: props.credentials } : {};
  var fetch = (0, _fetch2.default)(fetchOptions);

  return Object.keys(props).reduce(function (memo, key) {

    if ((0, _schema.isSchema)(props[key])) {

      var schema = props[key].schema || props[key];
      var getData = props[key].getData || function (data) {
        return data;
      };
      var idField = (0, _schema.getIdField)(schema);
      var resourceType = schema.title;
      var resourcePath = '/' + resourceType;
      var url = '' + props.url + resourcePath;

      var getState = function getState(key) {
        return _store2.default.getState(['$api', props.url, resourceType].concat(key || []).map(function (item) {
          return String(item);
        }));
      };
      var setState = function setState(val, key) {
        return _store2.default.setState(['$api', props.url, resourceType].concat(key || []).map(function (item) {
          return String(item);
        }), val);
      };
      var setStateQuiet = function setStateQuiet(val, key) {
        return _store2.default.setStateQuiet(['$api', props.url, resourceType].concat(key || []), val);
      };
      var deleteState = function deleteState(path) {
        return setState(null, path);
      };

      var getCollection = function getCollection(path) {
        var collection = getState(['requests', path, 'data']);
        if (collection) {
          var models = getModels();
          return collection.reduce(function (memo, id) {
            var model = models.get(id);
            if (model) return memo.push(model);
            return memo;
          }, (0, _immutable.List)());
        } else {
          return null;
        }
      };

      var setCollection = function setCollection() {
        var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : (0, _immutable.List)();
        var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '/';

        var state = getState();
        var nextState = state.withMutations(function (map) {
          var dict = data.reduce(function (memo, item) {
            return _extends({}, memo, _defineProperty({}, item[idField], item));
          }, {});
          map.set('models', getModels().mergeDeep(dict));
          map.setIn(['requests', path, 'data'], (0, _immutable.List)(Object.keys(dict)));
        });
        setState(nextState);
      };

      var clearCollection = function clearCollection() {
        var path = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
        return deleteState(['requests', path, 'data']);
      };

      var getModels = function getModels() {
        return getState('models') || (0, _immutable.Map)();
      };
      var setModels = function setModels(data) {
        return setState(data, 'models');
      };
      var getModel = function getModel(id) {
        return getState(['models', id]);
      };
      var setModel = function setModel(id, data) {
        return setState((0, _immutable.fromJS)(data), ['models', id]);
      };
      var getPending = function getPending(path) {
        return getState(['requests', path, 'pending']);
      };
      var setPending = function setPending(path, data) {
        return setStateQuiet(data, ['requests', path, 'pending']);
      };
      var getError = function getError(path) {
        return getState(['requests', path, 'error']);
      };
      var setError = function setError(path, error) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        var method = options.quiet ? setStateQuiet : setState;
        method(error, ['requests', path, 'error']);
      };

      var setSearchResults = function setSearchResults(path) {
        return function (data) {
          return setCollection(data, path);
        };
      };
      var getSearchResults = function getSearchResults(path) {
        return getCollection(path);
      };

      var removeFromCollections = function removeFromCollections(map, id) {
        return [].concat(_toConsumableArray(map.get('requests').entries())).reduce(function (undo, _ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              path = _ref2[0],
              request = _ref2[1];

          var collection = request.get('data');
          if (_immutable.List.isList(collection)) {
            var modelIdx = collection.findIndex(function (modelId) {
              return modelId === id;
            });
            if (~modelIdx) {
              var nextCollection = collection.delete(modelIdx);
              map.setIn(['requests', path, 'data'], nextCollection);
              undo.push(function () {
                return setCollection(nextCollection.insert(modelIdx, id), path);
              });
            }
          }
          return undo;
        }, []);
      };

      var deleteModel = function deleteModel(id) {
        var undo = [];
        var state = getState();
        setState(state.withMutations(function (map) {
          var model = getModel(id);
          if (model) {
            map.set('models', getModels().delete(id));
            undo.push(function () {
              return setModels(getModels().set(id, model));
            });
            undo.push.apply(undo, _toConsumableArray(removeFromCollections(map, id)));
          }
        }));
        return undo;
      };

      var updateModel = function updateModel(id, vals) {
        var undo = [];
        var model = getModel(id);
        if (model) {
          setModel(id, model.mergeDeep(vals));
          undo.push(function () {
            return setModels(getModels().set(id, model));
          });
        }
        return undo;
      };

      var shouldFetch = function shouldFetch(path) {
        return !isUndo() && !getPending(path) && !getError(path);
      };

      var api = ['get', 'post', 'put', 'delete'].reduce(function (memo, method) {
        return _extends({}, memo, _defineProperty({}, method, function (path) {
          for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          setPending(path, true);
          return fetch[method].apply(fetch, ['' + url + (path === '/' ? '' : path)].concat(args)).then(function (response) {
            var data = getData(response);
            setPending(path, false);
            setError(path, null, { quiet: true });
            return data;
          }, function (err) {
            setPending(path, false);
            setError(path, err);
            return Promise.reject(err);
          });
        }));
      }, {});

      /**
       * api calls
       */
      var fetchAll = function fetchAll() {
        var path = '/';
        if (shouldFetch(path)) {
          api.get(path).then(function (data) {
            return setCollection(data, path);
          });
        }
      };

      var fetchOne = function fetchOne(id) {
        var path = '/' + id;
        if (shouldFetch(path)) {
          api.get(path).then(function (data) {
            return setModel(data[idField], _extends({}, data, { _fetched: true }));
          });
        }
      };

      var createOne = function createOne(data) {
        return api.post('/', data).then(function (data) {
          fetchAll();
          return data;
        });
      };

      var updateOne = function updateOne(id, data) {
        return api.put('/' + id, data);
      };

      var deleteOne = function deleteOne(id) {
        return api.delete('/' + id);
      };

      var search = function search(queryString) {
        var path = '?' + queryString;
        if (shouldFetch(path)) {
          return api.get(path).then(setSearchResults(path));
        }
        // TODO: store promise as pending value so it can be used on repeat
        // calls
        return Promise.resolve('pending');
      };

      /**/

      var $clear = function $clear(id) {
        return function () {
          return setModel(id, null);
        };
      };
      var $reset = function $reset(id) {
        return function () {
          return fetchOne(id);
        };
      };

      var optimisticDelete = function optimisticDelete(id) {
        var undoDelete = deleteModel(id);
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
          return options.optimistic === false ? deleteOne(id).then(function () {
            return deleteModel(id);
          }) : optimisticDelete(id);
        };
      };

      var optimisticUpdate = function optimisticUpdate(id, vals) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        var placeholder = typeof options.optimistic === 'function' ? options.optimistic(_extends({ id: id }, vals)) : vals;
        var undoUpdate = updateModel(id, placeholder);
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
          return options.optimistic === false ? updateOne(id, vals).then(function (data) {
            return updateModel(id, data);
          }) : optimisticUpdate(id, vals, options);
        };
      };

      var getPlaceholder = function getPlaceholder() {
        var path = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        var dataType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _immutable.List;

        var placeholder = dataType();
        placeholder.$isPending = true;
        placeholder.$error = path ? getError(path) : null;
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

      var main = function main() {
        var path = '/';
        var collection = getCollection(path);
        if (!collection) {
          fetchAll();
          return getPlaceholder(path);
        } else {
          return collection.map(addRestMethods);
        }
      };

      main.$get = function (id) {
        var model = getModel(id);
        if (!model || !model.get('_fetched')) {
          var path = '/' + id;
          fetchOne(id);
          return getPlaceholder(path, _immutable.Map);
        } else {
          return addRestMethods(model);
        }
      };

      // remove the cache for the resource collection
      main.$clear = function () {
        return clearCollection();
      };
      main.$reset = fetchAll;

      var optimisticCreate = function optimisticCreate(data) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (typeof options.optimistic === 'function') {
          var nextState = getState().withMutations(function (map) {
            return options.optimistic(map, data);
          });
          if (nextState) setState(nextState);
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

      // call signature: search({ queryOrWhatever: 'foo', otherParam: 0, anotherParam: 30 })
      // - sort so that we can cache consistently
      main.$search = function (args) {
        var queryString = Object.keys(args).sort().reduce(function (memo, key) {
          memo.append(key, args[key]);
          return memo;
        }, new URLSearchParams()).toString();
        return search(queryString);
      };

      main.$search.results = function (args) {
        var queryString = Object.keys(args).sort().reduce(function (memo, key) {
          memo.append(key, args[key]);
          return memo;
        }, new URLSearchParams()).toString();
        var path = '?' + queryString;
        var resultsCached = getSearchResults(path);
        if (resultsCached) {
          return addRestMethods(resultsCached);
        } else {
          var placeholder = (0, _immutable.List)();
          placeholder.$isPending = !!getPending(path);
          placeholder.$error = getError(path);
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

          if (method === '$get') {
            var cache = getState(['requests', path, 'data']);
            if (cache) {
              return _immutable.List.isList(cache) ? getCollection(path).map(addRestMethods) : cache;
            } else {
              if (shouldFetch(path)) {
                api.get.apply(api, [path].concat(args)).then(function (data) {
                  if (Array.isArray(data)) {
                    setCollection(data, path);
                  } else {
                    setState((0, _immutable.fromJS)(data), ['requests', path, 'data']);
                  }
                  return data;
                });
              }
              return getPlaceholder(path);
            }
          } else {
            return api[method].apply(api, [path].concat(args));
          }
        }));
      }, {});

      main._schema = schema;
      main._resourceType = resourceType;
      main.getState = getState;

      memo[key] = main;
    }
    return memo;
  }, {});
}

var Api = (_temp = _class = function (_React$Component) {
  _inherits(Api, _React$Component);

  function Api(props) {
    _classCallCheck(this, Api);

    var _this = _possibleConstructorReturn(this, (Api.__proto__ || Object.getPrototypeOf(Api)).call(this, props));

    _this.subscriptions = [];

    _this.api = createActions(props);
    _this.state = { cache: null };
    return _this;
  }

  _createClass(Api, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      var _this2 = this;

      this.subscriptions = Object.keys(this.api).map(function (key) {
        var resource = _this2.api[key]._resourceType;
        return _store2.default.subscribeTo(['$api', _this2.props.url, resource], function (state) {
          (0, _log2.default)('\uD83C\uDF00 <Api> is re-rendering based on state changes on branch: %c' + (_this2.props.url + ' ‣ ' + resource), 'color: #5B4532');
          _this2.setState({ cache: state });
        });
      });
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.subscriptions.forEach(function (subscription) {
        return _store2.default.unsubscribe(subscription);
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          children = _props.children,
          props = _objectWithoutProperties(_props, ['children']);

      return children && typeof children.type === 'function' ? _react2.default.cloneElement(children, _extends({}, props, this.api)) : children;
    }
  }]);

  return Api;
}(_react2.default.Component), _class.propTypes = {
  url: _propTypes2.default.string.isRequired,
  // see https://github.com/github/fetch#sending-cookies for reference
  credentials: _propTypes2.default.oneOf(['same-origin', 'include'])
}, _temp);
exports.default = Api;
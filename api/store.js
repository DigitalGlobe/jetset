'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = initApiStore;

var _immutable = require('immutable');

var _schema = require('../lib/schema');

var _store = require('../store');

var _store2 = _interopRequireDefault(_store);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/* basic state tree layout
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

function initApiStore(url, schema) {

  var resourceType = schema.title;
  var idField = (0, _schema.getIdField)(schema);

  var methods = {

    // core

    _getState: _store2.default.getState,

    getState: function getState(key) {
      return _store2.default.getState(['$api', url, resourceType].concat(key || []).map(function (item) {
        return String(item);
      }));
    },

    setState: function setState(val, key) {
      return _store2.default.setState(['$api', url, resourceType].concat(key || []).map(function (item) {
        return String(item);
      }), val);
    },

    setStateQuiet: function setStateQuiet(val, key) {
      return _store2.default.setStateQuiet(['$api', url, resourceType].concat(key || []), val);
    },

    // requests

    getRequests: function getRequests(path) {
      return methods.getState(['requests'].concat(path || []));
    },

    getRequestsData: function getRequestsData(path) {
      return methods.getRequests([path, 'data']);
    },

    setRequests: function setRequests(data, path) {
      return methods.setState(data, ['requests'].concat(path || []));
    },

    setRequestsData: function setRequestsData(path, data) {
      return methods.setRequests(data, [path, 'data']);
    },

    getPending: function getPending(path) {
      return methods.getRequests([path, 'pending']);
    },

    setPending: function setPending(path, data) {
      return methods.setStateQuiet(data, ['requests', path, 'pending']);
    },

    getError: function getError(path) {
      return methods.getRequests([path, 'error']);
    },

    setError: function setError(path, error) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var method = options.quiet ? methods.setStateQuiet : methods.setState;
      method(error, ['requests', path, 'error']);
    },

    // models

    getModels: function getModels() {
      return methods.getState('models') || (0, _immutable.Map)();
    },

    setModels: function setModels(data) {
      return methods.setState(data, 'models');
    },

    getModel: function getModel(id) {
      return methods.getState(['models', id]);
    },

    setModel: function setModel(id, data) {
      return methods.setState(data, ['models', id]);
    },

    deleteModel: function deleteModel(id) {
      var undo = [];
      var state = methods.getState();
      methods.setState(state.withMutations(function (map) {
        var model = methods.getModel(id);
        if (model) {
          map.set('models', methods.getModels().delete(id));
          undo.push(function () {
            return methods.setModels(methods.getModels().set(id, model));
          });
          undo.push.apply(undo, _toConsumableArray(methods.removeFromCollections(map, id)));
        }
      }));
      return undo;
    },

    updateModel: function updateModel(id, vals) {
      var undo = [];
      var model = methods.getModel(id);
      if (model) {
        methods.setModel(id, model.mergeDeep(vals));
        undo.push(function () {
          return methods.setModels(methods.getModels().set(id, model));
        });
      }
      return undo;
    },

    // collections (lists hydrated with models)

    getCollection: function getCollection(path) {
      var collection = methods.getRequestsData(path);
      if (collection) {
        var models = methods.getModels();
        return collection.reduce(function (memo, id) {
          var model = models.get(id);
          if (model) return memo.push(model);
          return memo;
        }, (0, _immutable.List)());
      } else {
        return null;
      }
    },

    setCollection: function setCollection() {
      var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : (0, _immutable.List)();
      var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '/';

      var state = methods.getState();
      var nextState = state.withMutations(function (map) {
        var dict = data.reduce(function (memo, item) {
          return _extends({}, memo, _defineProperty({}, item[idField], item));
        }, {});
        map.set('models', methods.getModels().mergeDeep(dict));
        map.setIn(['requests', path, 'data'], (0, _immutable.List)(Object.keys(dict)));
      });
      methods.setState(nextState);
    },

    clearCollection: function clearCollection() {
      var path = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
      return methods.setRequestsData(path, null);
    },

    removeFromCollections: function removeFromCollections(map, id) {
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
              return methods.setCollection(nextCollection.insert(modelIdx, id), path);
            });
          }
        }
        return undo;
      }, []);
    },

    clearAll: function clearAll() {
      methods.setRequests((0, _immutable.Map)());
      methods.setModels((0, _immutable.Map)());
    }
  };

  return methods;
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.localState = localState;
exports.globalState = globalState;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _store = require('./store');

var _store2 = _interopRequireDefault(_store);

var _log = require('./lib/log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var isObject = function isObject(item) {
  return !Array.isArray(item) && (typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object';
};

function subscribe(_ref) {
  var local = _ref.local,
      paths = _ref.paths;


  return function (Component) {

    var rootPath = local ? ['local', Component.name + ('_' + Math.round(Math.random() * Date.now()))] : [];
    var nPaths = paths.reduce(function (memo, item) {
      if (isObject(item)) {
        Object.keys(item).forEach(function (key) {
          return memo.set(key, item[key]);
        });
      } else {
        memo.set(item);
      }
      return memo;
    }, new Map());

    return function (_React$Component) {
      _inherits(Subscriber, _React$Component);

      function Subscriber(props) {
        _classCallCheck(this, Subscriber);

        var _this = _possibleConstructorReturn(this, (Subscriber.__proto__ || Object.getPrototypeOf(Subscriber)).call(this, props));

        _this.subscription = null;

        _this.componentWillMount = function () {
          _this.subscriptions = [].concat(_toConsumableArray(nPaths.keys())).map(_this.subscribeTo);
        };

        _this.componentWillUnmount = function () {
          return _this.subscriptions.forEach(_store2.default.unsubscribe);
        };

        _this.subscribeTo = function (path) {
          return _store2.default.subscribeTo(rootPath.concat(path), _this.onChange.bind(_this, path));
        };

        _this.onChange = function (path, state) {
          /* eslint-disable no-console */
          var branch = (0, _log.formatBranchArgs)(rootPath.concat(path));
          (0, _log2.default)('\uD83C\uDF00 <' + (Component.name || 'StatelessFunction') + '> is re-rendering based on changes on branch: ' + branch);
          _this.setState(_defineProperty({}, path, state && state.toJS ? state.toJS() : state));
        };

        _this.merge = function (path, val) {
          if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) !== 'object') {
            return _this.replace(path, val);
          } else {
            var fullPath = rootPath.concat(path);
            var state = _store2.default.getState(fullPath);
            return _store2.default.setState(fullPath, state.mergeDeep(val));
          }
        };

        _this.replace = function (path, val) {
          return _store2.default.setState(rootPath.concat(path), val);
        };

        _this.methods = function () {
          return [].concat(_toConsumableArray(nPaths.keys())).reduce(function (memo, path) {
            return _extends({}, memo, _defineProperty({}, path, {
              get: function get() {
                return _this.state[path];
              },
              set: function set(val) {
                return _this.merge(path, val);
              },
              replace: function replace(val) {
                return _this.replace(path, val);
              }
            }));
          }, {});
        };

        _this.render = function () {
          return _react2.default.createElement(Component, _extends({}, _this.props, _this.methods()));
        };

        _this.state = [].concat(_toConsumableArray(nPaths.entries())).reduce(function (memo, _ref2) {
          var _ref3 = _slicedToArray(_ref2, 2),
              key = _ref3[0],
              val = _ref3[1];

          return Object.assign(memo, _defineProperty({}, key, val));
        }, {});
        return _this;
      }

      return Subscriber;
    }(_react2.default.Component);
  };
}

function localState() {
  for (var _len = arguments.length, paths = Array(_len), _key = 0; _key < _len; _key++) {
    paths[_key] = arguments[_key];
  }

  return subscribe({ local: true, paths: paths });
}

function globalState() {
  for (var _len2 = arguments.length, paths = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    paths[_key2] = arguments[_key2];
  }

  return subscribe({ local: false, paths: paths });
}
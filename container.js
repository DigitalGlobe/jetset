'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = containerize;
exports.Children = Children;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _immutable = require('immutable');

var _store = require('./store');

var _store2 = _interopRequireDefault(_store);

var _log = require('./lib/log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function containerize(initialState) {

  return function decorate(Component) {

    var masterKey = Component.key || Component.name;
    var rootPath = ['containers', masterKey];

    return function (_React$Component) {
      _inherits(Container, _React$Component);

      function Container(props) {
        _classCallCheck(this, Container);

        var _this = _possibleConstructorReturn(this, (Container.__proto__ || Object.getPrototypeOf(Container)).call(this, props));

        _this.subscription = null;

        _this.componentWillMount = function () {
          _this.subscription = _store2.default.subscribeTo(rootPath, function (state) {
            /* eslint-disable no-console */
            (0, _log2.default)('\uD83C\uDF00 re-rendering container <' + masterKey + '>');
            _this.setState({ container: state && state.toJS ? state.toJS() : state });
          });
        };

        _this.componentWillUnmount = function () {
          return _store2.default.unsubscribe(_this.subscription);
        };

        _this.getStoreState = function () {
          return _store2.default.getState(rootPath);
        };

        _this.setStoreState = function (val) {
          var state = _this.getStoreState() || (0, _immutable.Map)();
          _store2.default.setState(rootPath, state.mergeDeep((0, _immutable.fromJS)(val)));
        };

        _this.replaceStoreState = function (val) {
          return _store2.default.setState(rootPath, val);
        };

        var currentState = _store2.default.getState(rootPath);
        if (currentState) {
          _this.state = { container: currentState.toJS ? currentState.toJS() : currentState };
        } else {
          _this.state = { container: initialState };
          _store2.default.setStateQuiet(rootPath, initialState);
        }
        return _this;
      }

      _createClass(Container, [{
        key: 'render',
        value: function render() {
          var _this2 = this;

          return _react2.default.createElement(Component, _extends({}, this.props, {
            container: {
              get: function get() {
                return _this2.state.container;
              },
              set: this.setStoreState,
              replace: this.replaceStoreState,
              state: this.state.container
            }
          }));
        }
      }]);

      return Container;
    }(_react2.default.Component);
  };
}

function Children(_ref) {
  var children = _ref.children,
      container = _ref.container,
      props = _objectWithoutProperties(_ref, ['children', 'container']);

  // eslint-disable-line 
  return children && typeof children.type === 'function' ? _react2.default.cloneElement(children, props) : children;
}
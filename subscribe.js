'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = function (pathToSubscribeTo) {

  return function (Component) {
    return function (_React$Component) {
      _inherits(Subscriber, _React$Component);

      function Subscriber(props) {
        _classCallCheck(this, Subscriber);

        var _this = _possibleConstructorReturn(this, (Subscriber.__proto__ || Object.getPrototypeOf(Subscriber)).call(this, props));

        _this.subscription = null;

        _this.componentWillMount = function () {
          return _this.subscription = _store2.default.subscribeTo(pathToSubscribeTo, _this.onChange);
        };

        _this.componentWillUnmount = function () {
          return _store2.default.unsubscribe(_this.subscription);
        };

        _this.onChange = function (state) {
          /* eslint-disable no-console */
          (0, _log2.default)('\uD83C\uDF00 <' + (Component.name || 'StatelessFunction') + '> is re-rendering based on changes on branch: ' + pathToSubscribeTo);
          _this.setState({ store: state });
        };

        _this.publish = function (maybeKey, maybeVal) {
          var path = [pathToSubscribeTo].concat(maybeVal ? maybeKey : []);
          var state = maybeVal || maybeKey;
          _store2.default.setState(path, state);
        };

        _this.render = function () {
          return _react2.default.createElement(Component, _extends({}, _this.props, _defineProperty({}, pathToSubscribeTo, {
            get: function get() {
              return _this.state.store;
            },
            set: _this.publish
          })));
        };

        _this.state = {
          store: null
        };
        return _this;
      }

      return Subscriber;
    }(_react2.default.Component);
  };
};

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _store = require('./store');

var _store2 = _interopRequireDefault(_store);

var _log = require('./lib/log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
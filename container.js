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

var _store = require('./store');

var _store2 = _interopRequireDefault(_store);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function containerize(Component) {

  var masterKey = Component.key || Component.name;

  return function (_React$Component) {
    _inherits(Container, _React$Component);

    function Container(props) {
      _classCallCheck(this, Container);

      var _this = _possibleConstructorReturn(this, (Container.__proto__ || Object.getPrototypeOf(Container)).call(this, props));

      _this.subscription = null;

      _this.componentWillMount = function () {
        _this.subscription = _store2.default.subscribeTo(masterKey, function (state) {
          /* eslint-disable no-console */
          if (state) {
            console.log('re-rendering', masterKey, 'based on state change:', state.toJS());
            _this.setState({ container: state });
          }
        });
      };

      _this.componentWillUnmount = function () {
        return _store2.default.unsubscribe(_this.subscription);
      };

      _this.getStoreState = function (key) {
        return _store2.default.getState([masterKey, key]);
      };

      _this.setStoreState = function (key, val) {
        return _store2.default.setState([masterKey, key], val);
      };

      _this.state = { container: null };
      return _this;
    }

    _createClass(Container, [{
      key: 'render',
      value: function render() {
        return _react2.default.createElement(Component, _extends({}, this.props, {
          container: {
            get: this.getStoreState,
            set: this.setStoreState,
            state: this.state.container
          }
        }));
      }
    }]);

    return Container;
  }(_react2.default.Component);
}

function Children(_ref) {
  var children = _ref.children,
      container = _ref.container,
      props = _objectWithoutProperties(_ref, ['children', 'container']);

  // eslint-disable-line 
  return children && typeof children.type === 'function' ? _react2.default.cloneElement(children, props) : children;
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _class, _temp;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _log = require('../lib/log');

var _log2 = _interopRequireDefault(_log);

var _api = require('./api');

var _api2 = _interopRequireDefault(_api);

var _store = require('../store');

var _store2 = _interopRequireDefault(_store);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Api = (_temp = _class = function (_React$Component) {
  _inherits(Api, _React$Component);

  function Api(props) {
    _classCallCheck(this, Api);

    var _this = _possibleConstructorReturn(this, (Api.__proto__ || Object.getPrototypeOf(Api)).call(this, props));

    _this.subscriptions = [];

    _this.api = (0, _api2.default)(props);
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

    // TODO: allow for multiple children

  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          children = _props.children,
          props = _objectWithoutProperties(_props, ['children']);

      var isValidChild = children && typeof children.type === 'function';
      if (isValidChild) {
        return _react2.default.cloneElement(children, _extends({}, props, this.api));
      } else {
        (0, _log2.default)('\u26A0 Warning: You have passed a child into <Api> that cannot receive its props. Be sure your custom component(s) are the only children of <Api>', children);
        return null;
      }
    }
  }]);

  return Api;
}(_react2.default.Component), _class.propTypes = {
  url: _propTypes2.default.string.isRequired,
  // see https://github.com/github/fetch#sending-cookies for reference
  credentials: _propTypes2.default.oneOf(['same-origin', 'include']),
  token: _propTypes2.default.string
}, _temp);
exports.default = Api;
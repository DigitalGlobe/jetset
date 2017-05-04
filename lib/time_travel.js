'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _store = require('../store');

var _store2 = _interopRequireDefault(_store);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TimeTravelExample = function (_React$Component) {
  _inherits(TimeTravelExample, _React$Component);

  function TimeTravelExample(props) {
    _classCallCheck(this, TimeTravelExample);

    var _this = _possibleConstructorReturn(this, (TimeTravelExample.__proto__ || Object.getPrototypeOf(TimeTravelExample)).call(this, props));

    _this.state = { skipExpansions: false };
    return _this;
  }

  _createClass(TimeTravelExample, [{
    key: 'render',
    value: function render() {
      var _this2 = this;

      var ignore = this.state.skipExpansions ? 'expansions' : null;
      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'button',
          { onClick: function onClick() {
              return _store2.default.prevState({ ignore: ignore });
            } },
          'Back'
        ),
        _react2.default.createElement(
          'button',
          { onClick: function onClick() {
              return _store2.default.nextState({ ignore: ignore });
            } },
          'Forward'
        ),
        _react2.default.createElement(
          'button',
          { onClick: function onClick() {
              return _store2.default.resetState();
            } },
          'Reset'
        ),
        _react2.default.createElement('input', { type: 'checkbox', onClick: function onClick() {
            return _this2.setState({ skipExpansions: !_this2.state.skipExpansions });
          } }),
        ' Skip tree expansion state changes'
      );
    }
  }]);

  return TimeTravelExample;
}(_react2.default.Component);

exports.default = TimeTravelExample;
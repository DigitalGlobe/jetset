'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactPortal = require('react-portal');

var _reactPortal2 = _interopRequireDefault(_reactPortal);

var _tree_view = require('./lib/tree_view');

var _tree_view2 = _interopRequireDefault(_tree_view);

var _time_travel = require('./lib/time_travel');

var _time_travel2 = _interopRequireDefault(_time_travel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function Positioner() {
  var style = {
    position: 'fixed',
    padding: '3px 0px 3px 4px',
    top: '0px',
    left: '0px',
    background: 'white',
    opacity: 0.9,
    borderBottom: '1px solid #ccc',
    boxShadow: '2px 2px 2px #ccc',
    width: '100%'
  };
  return _react2.default.createElement(
    'div',
    { style: style },
    _react2.default.createElement(
      'table',
      null,
      _react2.default.createElement(
        'tbody',
        null,
        _react2.default.createElement(
          'tr',
          null,
          _react2.default.createElement(
            'td',
            null,
            _react2.default.createElement(_tree_view2.default, null)
          ),
          _react2.default.createElement(
            'td',
            { style: { verticalAlign: 'top' } },
            _react2.default.createElement(_time_travel2.default, null)
          )
        )
      )
    )
  );
}

var TreeViewer = function (_React$Component) {
  _inherits(TreeViewer, _React$Component);

  function TreeViewer(props) {
    _classCallCheck(this, TreeViewer);

    var _this = _possibleConstructorReturn(this, (TreeViewer.__proto__ || Object.getPrototypeOf(TreeViewer)).call(this, props));

    _this.state = { show: false };
    return _this;
  }

  _createClass(TreeViewer, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this2 = this;

      window.jetset = {
        toggleDevTools: function toggleDevTools() {
          return _this2.setState({ show: !_this2.state.show });
        }
      };
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        _reactPortal2.default,
        { isOpened: this.state.show },
        _react2.default.createElement(Positioner, null)
      );
    }
  }]);

  return TreeViewer;
}(_react2.default.Component);

exports.default = TreeViewer;
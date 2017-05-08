'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.flatten = flatten;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _immutable = require('immutable');

var _reactTreeview = require('react-treeview');

var _reactTreeview2 = _interopRequireDefault(_reactTreeview);

var _store = require('../store');

var _store2 = _interopRequireDefault(_store);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function flatten(map, props, expansions) {
  var layer = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;

  return map.map(function (val, key) {
    var id = layer + '-' + key;
    var onClick = function onClick() {
      return props.onClick(id);
    };
    return _immutable.Map.isMap(val) || _immutable.List.isList(val) ? _react2.default.createElement(_reactTreeview2.default, { key: id, onClick: onClick, nodeLabel: _react2.default.createElement(
        'span',
        { onClick: onClick, className: 'node' },
        key
      ), collapsed: !expansions.get(id) }, flatten(val, props, expansions, layer + 1)) : _react2.default.createElement(
      'div',
      { key: id, className: 'info' },
      key,
      ': ',
      String(val)
    );
  });
}

var StateTreeView = function (_React$Component) {
  _inherits(StateTreeView, _React$Component);

  function StateTreeView(props) {
    _classCallCheck(this, StateTreeView);

    var _this = _possibleConstructorReturn(this, (StateTreeView.__proto__ || Object.getPrototypeOf(StateTreeView)).call(this, props));

    _this.onChange = function (state) {
      _this.setState({ tree: state });
    };

    _this.handleClick = function (key) {
      var path = ['expansions', key];
      var current = _store2.default.getState(path);
      _store2.default.setState(path, !current);
    };

    _this.state = { tree: _store2.default.getState() };
    return _this;
  }

  _createClass(StateTreeView, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      _store2.default.subscribeAll(this.onChange);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      _store2.default.unsubscribe(this.onChange);
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      return this.state.tree ? _react2.default.createElement(
        _reactTreeview2.default,
        { nodeLabel: _react2.default.createElement(
            'span',
            { onClick: function onClick() {
                return _this2.handleClick('0-root');
              }, className: 'node' },
            'state tree'
          ), collapsed: !_store2.default.getState(['expansions', '0-root']), onClick: function onClick() {
            return _this2.handleClick('0-root');
          } },
        flatten(this.state.tree, { onClick: this.handleClick }, _store2.default.getState('expansions') || (0, _immutable.Map)())
      ) : _react2.default.createElement(
        'span',
        null,
        'No state to show'
      );
    }
  }]);

  return StateTreeView;
}(_react2.default.Component);

exports.default = StateTreeView;
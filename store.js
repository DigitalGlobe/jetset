'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.canUndo = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.managesState = managesState;
exports.offersSubscription = offersSubscription;

var _immutable = require('immutable');

var _immutablediff = require('immutablediff');

var _immutablediff2 = _interopRequireDefault(_immutablediff);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function managesState() {

  var _state = (0, _immutable.Map)({});

  return {
    getState: function getState(args) {
      return !args ? _state : Array.isArray(args) ? _state.getIn(args) : _state.get(args);
    },
    setState: function setState(path, val) {
      _state = Array.isArray(path) ? _state.setIn(path, val) : _state.set(path, val);
    },
    resetState: function resetState(val) {
      var isUndo = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      _state = val.set('_reset', isUndo);
      return _state;
    }
  };
}

function offersSubscription() {

  var subscriptions = new Set();

  return {
    invoke: function invoke() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      subscriptions.forEach(function (listener) {
        return listener.apply(undefined, args);
      });
    },
    subscribe: function subscribe(callback) {
      subscriptions.add(callback);
    },
    unsubscribe: function unsubscribe(callback) {
      subscriptions.delete(callback);
    }
  };
}

function canUndo(_ref) {
  var _ref$apply = _ref.apply,
      _apply = _ref$apply === undefined ? function () {} : _ref$apply;

  var undo = (0, _immutable.List)();
  var idx = -1;

  var methods = {
    /* eslint-disable no-console */
    apply: function apply(idxNext, ignore) {
      var current = undo.get(idx);
      var next = undo.get(idxNext);
      var changes = (0, _immutablediff2.default)(current, next).toJS();
      if (!ignore || !changes.every(function (item) {
        return item.path.indexOf('/' + ignore) === 0;
      })) {
        console.log('\u23F1 timetravel: diff:', changes);
        idx = idxNext;
        _apply(next);
        return true;
      } else {
        console.log('\u23F1 timetravel: skipping this state because changes were only on \'' + ignore + '\' branch');
        return false;
      }
    },
    prev: function prev(_ref2) {
      var ignore = _ref2.ignore;

      var idxNext = idx - 1;
      if (idxNext >= -undo.size) {
        var display = idx * -1;
        console.log('\u23F1 timetravel: stepping back to ' + display + ' state(s) ago');
        if (!methods.apply(idxNext)) {
          methods.prev({ ignore: ignore });
        }
      } else {
        _apply((0, _immutable.Map)({}));
        console.log('\u23F1 timetravel: there are no earlier states than this one');
      }
    },
    next: function next(_ref3) {
      var ignore = _ref3.ignore;

      if (idx < -1) {
        var idxNext = idx + 1;
        console.log('\u23F1 timetravel: stepping forward to ' + (idx === -2 ? 'current state' : (idx + 2) * -1 + ' state(s) ago'));
        if (!methods.apply(idxNext)) {
          methods.next({ ignore: ignore });
        }
      } else {
        console.log('\u23F1 timetravel: you are at the current state');
      }
    },
    reset: function reset() {
      if (idx !== -1) {
        idx = -1;
        _apply(undo.get(idx), { reset: true });
      }
      console.log('\u23F1 timetravel: you are at the current state');
    },
    save: function save(state) {
      undo = undo.push(state);
    }
  };

  return methods;
}

exports.canUndo = canUndo;

var _offersSubscription = offersSubscription(),
    invoke = _offersSubscription.invoke,
    subscribe = _offersSubscription.subscribe,
    subscriptionMethods = _objectWithoutProperties(_offersSubscription, ['invoke', 'subscribe']);

var _managesState = managesState(),
    _setState = _managesState.setState,
    resetState = _managesState.resetState,
    stateMethods = _objectWithoutProperties(_managesState, ['setState', 'resetState']);

// TODO: clarify options


var undo = canUndo({ apply: function apply(state) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return invoke(resetState(state), !options.reset);
  } });

var store = _extends({}, subscriptionMethods, stateMethods, {
  setState: function setState() {
    var _console;

    /* eslint-disable no-console */
    undo.reset();

    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    (_console = console).log.apply(_console, ['setting state:'].concat(args));
    _setState.apply(undefined, args);
    var state = stateMethods.getState();
    undo.save(state);
    // TODO: bump into next event loop to avoid possible collisions?
    invoke(state);
  },
  setStateQuiet: function setStateQuiet() {
    var _console2;

    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    /* eslint-disable no-console */
    (_console2 = console).log.apply(_console2, ['setting state quiet (no re-rendering):'].concat(args));
    _setState.apply(undefined, args);
  },

  subscribe: subscribe,
  subscribeTo: function subscribeTo(path, callback) {
    var cache = null;
    var onChange = function onChange(state) {
      var nextState = state.getIn([].concat(path));
      if (nextState !== cache) {
        callback(nextState);
        cache = nextState;
      }
    };
    subscribe(onChange);
    return onChange;
  },

  nextState: undo.next,
  prevState: undo.prev,
  resetState: undo.reset
});

exports.default = store;
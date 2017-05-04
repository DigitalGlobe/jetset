'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = log;
exports.logWithStack = logWithStack;
exports.logError = logError;
exports.logGroup = logGroup;
exports.logGroupEnd = logGroupEnd;
exports.logWarn = logWarn;
exports.getStack = getStack;
exports.formatBranchArgs = formatBranchArgs;

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } } /* eslint-disable no-console */


function shouldLog() {
  return _config2.default.mode === 'development';
}

function formatArgs(args) {
  return args;
  //return args.reduce(( memo, item ) => {
  //if ( typeof item === 'string' && !~item.indexOf( 'color:' ) ) { 
  //memo[0] += item;
  //} else {
  //memo.push( item );
  //}
  //return memo;
  //}, ['']);
}

function log() {
  if (shouldLog()) {
    var _console;

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    (_console = console).log.apply(_console, _toConsumableArray(formatArgs(args)));
  }
}

function logWithStack() {
  if (shouldLog()) {
    var _console2;

    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    (_console2 = console).groupCollapsed.apply(_console2, _toConsumableArray(formatArgs(args)));
    console.log(getStack());
    console.groupEnd();
  }
}

function logError() {
  if (shouldLog()) {
    var _console3;

    (_console3 = console).error.apply(_console3, arguments);
  }
}

function logGroup() {
  if (shouldLog()) {
    var _console4;

    (_console4 = console).groupCollapsed.apply(_console4, arguments);
  }
}

function logGroupEnd() {
  if (shouldLog()) {
    var _console5;

    (_console5 = console).groupEnd.apply(_console5, arguments);
  }
}

function logWarn() {
  if (shouldLog()) {
    var _console6;

    (_console6 = console).warn.apply(_console6, arguments);
  }
}

function getStack() {
  var _ref = new Error(),
      stack = _ref.stack;

  return stack ? stack.split('\n').slice(4).map(function (item) {
    return item.trim();
  }).join('\n') : '';
}

function formatBranchArgs(path) {
  return [].concat(path).join(' ‣ ');
}
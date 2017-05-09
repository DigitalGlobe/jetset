"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (args) {
  return Object.keys(args).sort().reduce(function (memo, key) {
    memo.append(key, args[key]);
    return memo;
  }, new URLSearchParams()).toString();
};
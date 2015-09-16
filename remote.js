'use strict';

var debug = require('debug')('pouchdb-remote-client-stream:remote');
var extend = require('xtend');
var Stream = require('./stream');

module.exports = Remote;

var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
var defaults = {
  objectMode: true
};

function Remote(options) {
  if (! (this instanceof Remote)) {
    return new Remote(options);
  }

  var remote = this;

  this._seq = -1;
  this._callbacks = {};

  var opts = extend({}, defaults, options && options.stream);
  this._stream = Stream(this._callbacks, opts);
}

Remote.prototype.stream = function() {
  return this._stream;
}

Remote.prototype.invoke = function invoke(method, args, cb) {
  debug('invoke, method=%s, args=%j', method, args);
  var seq = this._sequence();
  this._callbacks[seq] = cb;
  this._stream._readable.write([seq, method, args]);
}

Remote.prototype._sequence = function _sequence() {
  var n = ++ this._seq;
  if (n > MAX_SAFE_INTEGER) {
    this._seq = n = 0;
  }
  return n;
}


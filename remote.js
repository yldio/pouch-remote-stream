'use strict';

var debug = require('debug')('pouchdb-remote-stream:remote');
var extend = require('xtend');
var Stream = require('./stream');

module.exports = Remote;

var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
var CHANGE_EVENTS = ['change', 'complete', 'error'];

var defaults = {
  objectMode: true,
};

function Remote(options) {
  if (! (this instanceof Remote)) {
    return new Remote(options);
  }
  debug('remote options:', options);

  var remote = this;

  this._seq = -1;
  this._listenerSeq = -1;
  this._callbacks = {};
  this._listeners = {};

  var opts = extend({}, defaults, options && options.stream);
  this._stream = Stream(this._callbacks, opts);

  CHANGE_EVENTS.forEach(function eachEvent(event) {
    remote._stream.on(event, function onEvent(data) {
      debug('event', event, data);
      var listener = remote._listeners[data[0]];
      if (listener) {
        debug('have listener for event %s', event);
        process.nextTick(function onNextTick() {
          debug('emitting event %s (%j)', event, data[1]);
          var emitted = listener.emit(event, data[1]);
          debug('emitted event %s ? %j', event, emitted);
        });
      }
    });
  });
}

Remote.prototype.stream = function stream() {
  return this._stream;
};

Remote.prototype.invoke = function invoke(db, method, args, cb) {
  debug('invoke, db=%s, method=%s, args=%j, cb=', db, method, args, cb);
  var seq = this._sequence();
  if (cb) {
    if (typeof cb !== 'function') {
      throw new Error('callback is not a function');
    }
    debug('callback:', cb);
    this._callbacks[seq] = cb;
  }
  this._stream._readable.write([seq, db, method, args]);
};

Remote.prototype.addListener = function addListener(listener) {
  var listenerId = this._listenerSequence();

  this._listeners[listenerId] = listener;

  debug('added listener %d', listenerId);

  return listenerId;
};

Remote.prototype.removeListener = function removeListener(id) {
  delete this._listeners[id];
};

Remote.prototype._sequence = function _sequence() {
  var n = ++ this._seq;
  if (n > MAX_SAFE_INTEGER) {
    this._seq = n = 0;
  }
  return n;
};

Remote.prototype._listenerSequence = function _sequence() {
  var n = ++ this._listenerSeq;
  if (n > MAX_SAFE_INTEGER) {
    this._listenerSeq = n = 0;
  }
  return n;
};

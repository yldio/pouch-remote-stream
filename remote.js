'use strict';

var debug = require('debug')('pouch-remote-stream:remote');
var extend = require('xtend');
var Stream = require('./stream');

module.exports = Remote;

var CHANGE_EVENTS = ['change', 'complete', '_error'];

var defaults = {
  stream: {
    objectMode: true,
  },
  maxSeq: 9007199254740991,
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

  this._options = extend({}, defaults, options);
  this._options.stream = extend(this._options.stream, defaults.stream, options && options.stream);
  this.stream = Stream(this._callbacks, this._options.stream);

  CHANGE_EVENTS.forEach(function eachEvent(event) {
    remote.stream.on(event, function onEvent(data) {
      debug('event', event, data);
      var listener = remote._listeners[data[0]];
      var eventName = event;
      if (eventName === '_error') {
        eventName = 'error';
      }
      if (listener) {
        debug('have listener for event %s', eventName);
        process.nextTick(function onNextTick() {
          debug('emitting event %s (%j)', eventName, data[1]);
          var emitted = listener.emit(eventName, data[1]);
          debug('emitted event %s ? %j', eventName, emitted);
        });
      }
    });
  });
}

Remote.prototype.invoke = function invoke(db, method, args, cb) {
  debug('invoke, db=%s, method=%s, args=%j, cb=', db, method, args, cb);
  var seq = this._sequence();
  if (cb) {
    this._callbacks[seq] = cb;
  }
  this.stream._readable.write([seq, db, method, args]);
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
  if (n > this._options.maxSeq) {
    this._seq = n = 0;
  }
  return n;
};

Remote.prototype._listenerSequence = function _sequence() {
  var n = ++ this._listenerSeq;
  if (n > this._options.maxSeq) {
    this._listenerSeq = n = 0;
  }
  return n;
};

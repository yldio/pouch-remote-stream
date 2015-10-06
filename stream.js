'use strict';

var debug = require('debug')('pouchdb-remote-stream:stream');
var stream = require('stream');
var duplexify = require('duplexify');

module.exports = function Stream(callbacks, opts) {
  var s = duplexify(writable(opts), readable(opts), opts);
  return s;

  function writable(options) {
    debug('writable options:', options);
    var st = new stream.Writable(options);
    st._write = _write;
    return st;
  }

  function _write(data, encoding, callback) {
    debug('_write', data);
    if (typeof data !== 'object') {
      callback(new Error('expected object, instead got ' +
        typeof data));
    } else {
      var seq = data[0];
      if (seq === '_event') {
        var event = data[1];
        var eventData = data[2];
        var eventName = event;
        if (eventName == 'error') {
          debug('we have an error event here');
          eventName = '_error';
        }
        debug('emitting event: %s (%j)', eventName, eventData);
        s.emit(eventName, eventData);
        callback();
      } else {
        var cb = callbacks[seq];
        if (cb) {
          debug('have callback', cb);
          delete callbacks[seq];
          var payload = data[1];
          errorForPayload(payload);
          debug('applying callback with', payload);
          cb.apply(null, payload);
          debug('applied callback');
        }
        callback();
      }
    }
  }

  function readable(options) {
    debug('readable options:', options);
    return new stream.PassThrough(options);
  }
};

function errorForPayload(payload) {
  var err = payload && payload[0];
  if (err) {
    var error = payload[0] = new Error(err.message || 'Unknown error');
    error.status = error.statusCode = err.status;
    error.error = err.error;
    error.name = err.name;
  }
}

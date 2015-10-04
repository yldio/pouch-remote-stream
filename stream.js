'use strict';

var debug = require('debug')('pouchdb-remote-stream:stream');
var stream = require('stream');
var extend = require('xtend');
var duplexify = require('duplexify');

module.exports = function Stream(callbacks, opts) {
  var s = duplexify(writable(opts), readable(opts), opts);
  return s;

  function writable(options) {
    debug('writable options:', options);
    var s = new stream.Writable(options);
    s._write = _write;
    return s;
  }

  function _write(data, encoding, callback) {
    debug('_write', data);
    if (typeof data != 'object') {
      callback(new Error('expected object, instead got ' +
        typeof data));
    }
    else {
      var seq = data[0];
      if (seq == '_event') {
        var event = data[1];
        var data = data[2];
        debug('event: %s (%j)', event, data);
        s.emit(event, data);
        callback();
      }
      else {
        var cb = callbacks[seq];
        if (cb) {
          debug('have callback', cb);
          delete callbacks[seq];
          var payload = data[1];
          errorForPayload(payload);
          debug('applying callback with', payload);
          try {
            cb.apply(null, payload);
          } catch(err) {
            console.error(err.stack);
            throw err;
          }

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
}

function errorForPayload(payload) {
  var err = payload && payload[0];
  if (err) {
    var error = new Error(err.message || 'Unknown error');
    error.status = error.statusCode = err.status;
    payload[0] = error;
  }
}
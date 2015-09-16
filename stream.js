'use strict';

var debug = require('debug')('pouchdb-remote-client-stream:stream');
var stream = require('stream');
var duplexify = require('duplexify');


module.exports = function Stream(callbacks, opts) {
  return duplexify(writable(opts), readable(opts), opts);

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
      var cb = callbacks[seq];
      if (cb) {
        delete callbacks[seq];
        cb.apply(null, data[1]);
      }
      callback();
    }
  }

  function readable(options) {
    debug('readable options:', options);
    return new stream.PassThrough(options);
  }
}

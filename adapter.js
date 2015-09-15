'use strict';

var once = require('once');
var debug = require('debug')('pouchdb-remote-client-stream:adapter');

module.exports = Adapter;

function Adapter(opts, callback) {
  var cb = callback ? once(callback) : noop;
  debug('adapter constructor called', options);

  if (! opts.remote) {
    return error('need a remote option');
  }

  this._name = opts.originalName;
  this.skipDependentDatabase = true;

  callback(null, this);

  function error(err) {
    if (typeof err != 'object') {
      err = new Error(err);
    }
    cb(err);
  }
}

Adapter.valid = function() {
  return true;
};

var A = Adapter.prototype;

A.type = function() {
  return 'remote';
};

A._id = function() {
  callback(null, 1);
};

A.get = function(id, opts, callback) {
  callback();
};

function noop() {};
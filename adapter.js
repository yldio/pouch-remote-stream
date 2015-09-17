'use strict';

var once = require('once');
var timers = require('timers');
var methods = require('./methods');
var debug = require('debug')('pouchdb-remote-client-stream:adapter');
var EventEmitter = require('events').EventEmitter;

module.exports = Adapter;

function Adapter(opts, callback) {
  var adapter = this;
  var cb = callback ? once(callback) : noop;

  try {
    debug('adapter constructor called', opts);
    if (! opts.remote) {
      return error('need a remote option');
    }

    if (! opts.originalName) {
      return error('need a originalName option');
    }

    this._name = opts.originalName;
    this.skipDependentDatabase = true;

    timers.setImmediate(cb, null, this);
    debug('done constructing adapter');

    this.type = type;

    methods.forEach(function(method) {
      adapter[method] = wrap(method);
    });

    this._changes = changes;

  } catch(e) {
    console.error(e);
    callback(e);
  }

  function error(err) {
    if (typeof err != 'object') {
      err = new Error(err);
    }
    cb(err);
  }

  function wrap(method) {
    return function() {
      var args = parseArgs(arguments);
      var cb = extractCB(args) || noop;
      opts.remote.invoke(opts.originalName, method, args, cb);
    }
  }

  function changes(options) {
    var results = {};

    if (!options.live) {
      results.results = [];
    }

    var listener = new EventEmitter();
    var id = opts.remote.addListener(listener);
    opts.remote.invoke(opts.originalName, '_changes', [id, options]);

    listener.cancel = cancel;

    listener.once('error', cancel);
    listener.once('error', function(err) {
      options.complete(err);
    });

    listener.on('change', function(change) {
      debug('change %j', change);
      results.last_seq = change.seq;
      if (!options.live) {
        results.results.push(change);
      }
    });
    listener.on('change', options.onChange);

    listener.once('complete', function() {
      debug('complete, results = %j', results);
      options.complete(null, results);
    });
    listener.once('complete', cancel);

    function cancel() {
      debug('canceling listeenr %d', id);
      opts.remote.removeListener(id);
    }
  }
}

Adapter.valid = function() {
  return true;
};

function type() {
  return 'remote';
};

function noop() {};

function parseArgs(args) {
  return Array.prototype.slice.call(args);
}

function extractCB(args) {
  var cb = args[args.length - 1];
  if (typeof cb == 'function') {
    args.pop();
  }

  return cb;
}
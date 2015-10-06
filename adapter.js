'use strict';

var once = require('once');
var timers = require('timers');
var methods = require('./methods');
var debug = require('debug')('pouch-remote-stream:adapter');
var EventEmitter = require('events').EventEmitter;
var promisify = require('./lib/promisify');

module.exports = Adapter;

function Adapter(opts, callback) {
  var adapter = this;
  var cb = once(callback);

  debug('adapter constructor called', opts);
  if (! opts.remote) {
    return error('need a remote option');
  }

  this._name = opts.originalName;
  this.skipDependentDatabase = true;

  timers.setImmediate(cb, null, this);

  this.type = type;

  methods.forEach(function eachMethod(method) {
    adapter[method] = wrap(method);
  });

  this._changes = changes;

  debug('done constructing adapter');

  function error(err) {
    cb(new Error(err));
  }

  function wrap(method) {
    return promisify(function promisified() {
      debug('calling %s, (%j)', method, arguments);
      var args = parseArgs(arguments);
      opts.remote.invoke(opts.originalName, method, args, extractCB(args));
    });
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
    listener.on('error', function onceError(err) {
      debug('onceError');
      options.complete(err);
    });

    listener.on('change', function onChange(change) {
      debug('change %j', change);
      results.last_seq = change.seq;
      if (!options.live) {
        results.results.push(change);
      }
    });
    listener.on('change', options.onChange);

    listener.once('complete', function onceComplete() {
      debug('complete, results = %j', results);
      options.complete(null, results);
    });
    listener.once('complete', cancel);

    function cancel() {
      debug('canceling listener %d', id);
      opts.remote.removeListener(id);
    }
  }
}

Adapter.valid = function valid() {
  return true;
};

function type() {
  return 'remote';
}

function parseArgs(args) {
  return Array.prototype.slice.call(args);
}

function extractCB(args) {
  return args.pop();
}

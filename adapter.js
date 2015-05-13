var each = require('async-each');
var extend = require('xtend');
var RPC = require('rpc-stream');
var binUtil = require('pouchdb-binary-util');
var uuid = require('node-uuid').v4;
var log = require('debug')('pouchdb:remotestream:adapter');
var clientMethods = require('./client-methods');

function RemoteStream(opts, callback) {
  try {
    log('adapter constructor called');
    var api = this;

    if (typeof opts === 'string') {
      var slashIdx = utils.lastIndexOf(opts, '/');
      opts = {
        url: opts.substring(0, slashIdx),
        name: opts.substring(slashIdx + 1)
      };
    }

    opts = extend({}, opts);

    if (! opts.remote) {
      var err = new Error('need a remote option');
      if (callback) {
        callback(err);
      } else {
        api.emit('error', err);
      }
    }

    if (!opts.name) {
      var optsErrMessage = 'Error: you must provide a database name.';
      return callback(new Error(optsErrMessage));
    }

    log('going to create remote stream', opts.name);
    var remoteStream = opts.remote.createStream(opts.name);

    var server = RPC();

    remoteStream.pipe(server).pipe(remoteStream);

    var remote = server.wrap(clientMethods);

    Object.keys(remote).forEach(function(method) {
      var m = remote[method];
      if (typeof m == 'function') {
        remote[method] = function() {
          log('client calling %s (%j)', method, arguments);
          var args = Array.prototype.slice.call(arguments);
          var cb = args[args.length - 1];
          if ((typeof cb) != 'function') {
            cb = function(err) {
              if (err) {
                api.emit('error', err);
              }
            };
            args.push(cb);
          }

          args.pop();
          args.push(function() {
            log('got reply from %s: ', method, arguments);
            cb.apply(null, arguments);
          });

          log('client called %s ', method, args);
          try {
            m.apply(remote, args);
          } catch(err) {
            log('error calling %s:', method, err.stack || err.message || err);
            cb(err);
          }

        };
      }
    });

    api.type = function() {
      return 'remote';
    };

    api._id = remote.id;

    api.compact = remote.compact;

    api._info = remote.info;

    api.get = remote.get;

    api.remove = remote.remove;

    api.getAttachment = remote.getAttachment;

    api.removeAttachment = remote.removeAttachment;

    api.putAttachment = remote.putAttachment;

    api.put = remote.put;

    api.post = remote.post;

    api._bulkDocs = remote.bulkDocs;

    api._allDocs = remote.allDocs;

    api._changes = function (opts) {
      opts = clone(opts);

      if (opts.continuous) {
        var messageId = uuid();
        api._changesListeners[messageId] = opts.onChange;
        api._callbacks[messageId] = opts.complete;
        var channel = 'changes-' + uuid();

        var changes = remote.createReadStream(channel);
        changes.on('data', function(d) {
          opts.onChange(d);
        });
        changes.once('end', function() {
          opts.onComplete();
        });
        changes.on('error', function(err) {
          opts.onComplete(err);
        });

        remote.liveChanges(opts, channel, function(err) {
          if (err) {
            opts.complete(err);
          }
        });
        return {
          cancel: function () {
            changes.close();
          }
        };
      }

      // just send all the docs anyway because we need to emit change events
      // TODO: be smarter about emitting changes without building up an array
      var returnDocs = 'returnDocs' in opts ? opts.returnDocs : true;
      opts.returnDocs = true;

      remote.changes(opts, function (err, res) {
        if (err) {
          opts.complete(err);
        }
        res.results.forEach(function (change) {
          opts.onChange(change);
        });
        if (!returnDocs) {
          res.results = [];
        }
        opts.complete(null, res);
      });
    };

    api.revsDiff = remote.revsDiff;

    api._query = remote.query;

    api._viewCleanup = remote.viewCleanup;

    api._close = function close(callback) {
      process.nextTick(function() {
        remoteStream.end();
      });
      callback();
    };

    api.destroy = function (callback) {
      remote.destroy(function(err, res) {
        if (err) {
          callback(err);
        } else {
          api._close(function (err) {
            if (err) {
              callback(err);
            } else {
              api.emit('destroyed');
              api.constructor.emit('destroyed', api._name);
              callback(null, res);
            }
          });
        }
      });
    };

    callback(null, api);
  } catch(err) {
    console.error(err.stack || err.message || err);
    callback(err);
  }
};

function preprocessAttachments(doc, cb) {
  if (!doc._attachments || !Object.keys(doc._attachments)) {
    return cb();
  }

  each(Object.keys(doc._attachments), function (key, cb) {
    var attachment = doc._attachments[key];
    if (attachment.data && typeof attachment.data !== 'string') {
      if (isBrowser) {
        binUtil.readAsBinaryString(attachment.data, function (binary) {
          attachment.data = utils.btoa(binary);
          cb();
        });
      } else {
        attachment.data = attachment.data.toString('base64');
        cb();
      }
    } else {
      cb();
    }
  }, cb);
};

RemoteStream.valid = function() {
  return true;
};

RemoteStream.destroy = function(name, opts, callback) {
  callback(new Error('not implemented'));
};


var pouchExtend = require('pouchdb-extend');

function clone(obj) {
  return pouchExtend(true, {}, obj);
};

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.adapter('remote', module.exports);
}

log('defined adapter');

module.exports = RemoteStream;

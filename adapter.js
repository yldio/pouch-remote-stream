var each = require('async-each');
var extend = require('xtend');
var RPC = require('rpc-stream');
var binUtil = require('pouchdb-binary-util');
var uuid = require('node-uuid').v4;
var log = require('debug')('pouchdb:remote-stream:adapter');
var clientMethods = require('./client-methods');

var defaultArguments = {};

module.exports = RemoteStream;

function RemoteStream(opts, callback) {
  var api = this;

  if (typeof opts === 'string') {
    var slashIdx = utils.lastIndexOf(opts, '/');
    opts = {
      url: opts.substring(0, slashIdx),
      name: opts.substring(slashIdx + 1)
    };
  }

  opts = extend({}, opts, defaultArguments);

  log('constructor called', opts);

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

  var remoteStream = remote.createStream(opts);

  var server = RPC();
  remoteStream.pipe(server).pipe(remoteStream);
  var remote = server.wrap(clientMethods);

  api.type = 'remote';

  api._id = server.id;

  api.compact = server.compact;

  api._info = server.info;

  api.get = function get(id, opts, cb) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    server.get(id, opts, cb);
  };

  api.remove = function remove(docOrId, optsOrRev, opts, callback) {
    var doc;
    if (typeof optsOrRev === 'string') {
      // id, rev, opts, callback style
      doc = {
        _id: docOrId,
        _rev: optsOrRev
      };
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
    } else {
      // doc, opts, callback style
      doc = docOrId;
      if (typeof optsOrRev === 'function') {
        callback = optsOrRev;
        opts = {};
      } else {
        callback = opts;
        opts = optsOrRev;
      }
    }
    var rev = (doc._rev || opts.rev);

    server.remove(doc._id, rev, callback);
  };

  api.getAttachment = function (docId, attachmentId, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    server.getAttachment(docId, attachmentId, opts, callback)
  };

  api.removeAttachment = server.removeAttachment;

  api.putAttachment = function (docId, attachmentId, rev, blob,
                                type, callback) {
    if (typeof type === 'function') {
      callback = type;
      type = blob;
      blob = rev;
      rev = null;
    }
    if (typeof type === 'undefined') {
      type = blob;
      blob = rev;
      rev = null;
    }

    if (typeof blob === 'string') {
      var binary;
      try {
        binary = utils.atob(blob);
      } catch (err) {
        // it's not base64-encoded, so throw error
        return callback(errors.error(errors.BAD_ARG,
          'Attachments need to be base64 encoded'));
      }
      if (isBrowser) {
        blob = utils.createBlob([utils.binaryStringToArrayBuffer(binary)], {type: type});
      } else {
        blob = binary ? new buffer(binary, 'binary') : '';
      }
    }

    var args = [docId, attachmentId, rev, null, type];

    server.putAttachment(docId, attachmentId, rev, blob, type, callback);
  };

  api.put = function() {
    var args = Array.prototype.slice.call(arguments);
    var temp, temptype, opts;
    var doc = args.shift();
    var id = '_id' in doc;
    var callback = args.pop();
    if (typeof doc !== 'object' || Array.isArray(doc)) {
      return callback(errors.error(errors.NOT_AN_OBJECT));
    }

    doc = clone(doc);

    preprocessAttachments(doc, function() {
      while (args.length) {
        temp = args.shift();
        temptype = typeof temp;
        if (temptype === "string" && !id) {
          doc._id = temp;
          id = true;
        } else if (temptype === "string" && id && !('_rev' in doc)) {
          doc._rev = temp;
        } else if (temptype === "object") {
          opts = utils.clone(temp);
        }
      }
      opts = opts || {};

      server.put(doc, opts, callback);
    });
  };

  api.post = function (doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = utils.clone(opts);

    server.post(doc, opts, callback);
  };

  api._bulkDocs = server.bulkDocs;

  api._allDocs = function (opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    server.allDocs(opts, callback);
  };

  api._changes = function (opts) {
    opts = utils.clone(opts);

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

      server.liveChanges(opts, channel, function(err) {
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

    server.changes(opts, function (err, res) {
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

  api.revsDiff = function (req, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    server.revsDiff(req, opts, callback);
  };


  api._query = function (fun, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    var funEncoded = fun;
    if (typeof fun === 'function') {
      funEncoded = {map: fun};
    }
    server.query(funEncoded, opts, callback);
  };

  api._viewCleanup = server.viewCleanup;

  api._close = function close(callback) {
    remoteStream.end();
  };

  api.destroy = function (callback) {
    server.destroy(function(err, res) {
      if (err) {
        callback(err);
      } else {
        api._close(function (err) {
          if (err) {
            return callback(err);
          }
          api.emit('destroyed');
          api.constructor.emit('destroyed', api._name);
          callback(null, res);
        });
      }
    });
  };

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

var pouchExtend = require('pouchdb-extend');

function clone(obj) {
  return pouchExtend.extend(true, {}, obj);
};
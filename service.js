var extend = require('xtend');
var PouchDB = require('pouchdb');
var clientMethods = require('./client-methods');
var log = require('debug')('pouchdb:remotestream:service');

module.exports = Service;

var defaultOptions = {
  adapter: 'http'
};

function Service(dbName, options) {
  log('constructing service for', dbName);
  options = extend({}, defaultOptions, options);
  var db = new PouchDB(dbName, options);
  var service = {};
  clientMethods.forEach(function(method) {
    service[method] = function() {
      log('%j server method called. arguments: ', method, arguments);
      var args = Array.prototype.slice.call(arguments);
      var cb = args.pop();
      args.push(function() {
        log('call to %s returned: %j', method, arguments);
        cb.apply(null, arguments);
      });
      log('applying %s to db ', method, args);

      try {
        db[method].apply(db, args);
      } catch(err) {
        cb(err);
      }
    };
  });

  return service;
}
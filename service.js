var extend = require('xtend');
var PouchDB = require('pouchdb');
var clientMethods = require('./client-methods');
var log = require('debug')('pouchdb:remotestream:service');

module.exports = Service;

var defaultOptions = {
  adapter: 'http'
};

function Service(dbName, options) {
  options = extend({}, defaultOptions, options);
  var db = new PouchDB(dbName, options);
  var service = {};
  clientMethods.forEach(function(method) {
    service[method] = function() {
      log('%j server method called. arguments: ', method, arguments);
      db.apply(db, arguments);
    };
  });

  log('service:', service);

  return service;
}
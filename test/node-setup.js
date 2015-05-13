var log = require('debug')('pouchdb:remotestream:client');

var PouchRemoteStream = require('../');
var remote = PouchRemoteStream();
global.PouchDB = require('pouchdb');

global.PouchDB.adapter('remote', PouchRemoteStream.adapter);
global.PouchDB.preferredAdapters = ['remote'];

global.testUtils = require('../node_modules/pouchdb/tests/integration/utils');
global.should = require('chai').should();

global.PouchDB = global.PouchDB.defaults({
  adapter: 'remote',
  remote: remote
});

var net = require('net');
var stream = net.connect(3004, function() {
  log('connected');
});
stream.pipe(remote).pipe(stream);

// remote.on('data', function(d) {
//   log('*** client GOT DATA', d.toString());
// });

stream.on('data', function(d) {
  log('CLIENT GOT DATA', d.toString());
});

stream.once('close', function() {
  log('client stream closed');
});

stream.once('end', function() {
  log('client stream ended');
});

console.log('node setup ran');
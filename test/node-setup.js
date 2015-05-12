console.log('running node setup...');

var PouchRemoteStream = require('../');
var PouchDB = global.PouchDB = require('pouchdb');

global.testUtils = require('../node_modules/pouchdb/tests/integration/utils');
global.should = require('chai').should();

PouchDB.adapter('remote', PouchRemoteStream.adapter);
PouchDB.preferredAdapters = ['remote'];

var remote = PouchRemoteStream();

global.PouchDB = global.PouchDB.defaults({
  adapter: 'remote',
  remote: remote
});

var net = require('net');
var stream = net.connect(3004);
stream.pipe(remote).pipe(stream);

console.log('node setup ran');
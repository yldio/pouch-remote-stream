var net = require('net');
var PouchDB = require('pouchdb');
global.PouchDB = require('pouchdb');
global.testUtils = require('../node_modules/pouchdb/tests/integration/utils');

var PouchRemoteStream = require('../');
PouchDB.adapter('remote', PouchRemoteStream.adapter);
PouchDB.preferredAdapters = ['remote'];


var remote = PouchRemoteStream();

global.PouchDB = global.PouchDB.defaults({
  remote: remote
});

var stream = net.connect(3004);
stream.pipe(remote).pipe(stream);

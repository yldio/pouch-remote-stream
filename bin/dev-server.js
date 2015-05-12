var net = require('net');
var PouchRemoteStream = require('../server');
var log = require('debug')('pouchdb:remotestream:devserver');

var server = net.createServer(function(conn) {
  conn.setEncoding('utf8');
  conn.on('data', function(d) {
    log('raw data from client', d);
  });

  conn.pipe(PouchRemoteStream()).pipe(conn);
});

server.listen(3004, function() {
  console.log('dev server listening on %j', server.address());
});
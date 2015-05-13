var net = require('net');
var PouchServerStream = require('../server');
var log = require('debug')('pouchdb:remotestream:devserver');

var server = net.createServer(function(conn) {
  var write = conn.write;
  conn.write = function(d) {
    log('server writing to client: %s', d);
    write.apply(conn, arguments);
  };
  conn.end = function() {
    log('ended');
  };
  conn.once('error', function(err) {
    log('error:', err.stack || err.message || err);
  });
  conn.pipe(PouchServerStream()).pipe(conn);
});

server.listen(3004, function() {
  console.log('dev server listening on %j', server.address());
});
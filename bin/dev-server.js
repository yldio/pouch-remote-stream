var net = require('net');
var MuxDemux = require('mux-demux');
var server = net.createServer(function(conn) {
  console.log('new connection');
  conn.on('data', function(d) {
    console.log('<-', d);
  });
  var m = MuxDemux(handleStream);
  conn.pipe(m).pipe(conn);
});

function handleStream(stream) {
  console.log('-> NEW STREAM %s', stream.meta);
  stream.on('data', function(d) {
    console.log('-> (%s) %j', stream.meta, d);
  });
  stream.once('end', function(d) {
    console.log('-> (%s) ENDED', stream.meta);
  });
}

server.listen(3004, function() {
  console.log('dev server listening on %j', server.address());
});
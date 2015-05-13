var MuxDemux = require('mux-demux/msgpack');
var RPC = require('rpc-stream');
var Service = require('./service');
var log = require('debug')('pouchdb:remotestream:server');

module.exports = function Server(options) {
  return MuxDemux(handleStream);

  function handleStream(stream) {
    log('new server stream', stream.meta);
    var rpc = RPC(Service(stream.meta, options));
    stream.pipe(rpc).pipe(stream);
  }
}


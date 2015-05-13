var MuxDemux = require('mux-demux/msgpack');

module.exports = function RemoteStream() {
  return MuxDemux();
};
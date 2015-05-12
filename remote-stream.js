var MuxDemux = require('mux-demux');
var inherits = require('inherits');

module.exports = function RemoteStream(options) {
  return MuxDemux();
};
var RemoteStream = require('./remote-stream');

module.exports = function create(options) {
  return new RemoteStream(options);
};

module.exports.adapter = require('./adapter');
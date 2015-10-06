var Tests = require('pouch-stream-tests');
exports.lab = Tests.lab;
Tests(require('../'), require('pouch-stream-server'));

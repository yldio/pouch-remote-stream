'use strict';

/* eslint func-names: 0 */

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.it;

var Remote = require('../');

describe('listeners', function() {
  var remote = Remote();

  it('event with no listeners gets ignored', function(done) {
    remote.stream.write(['_event', 'change', []]);
    setTimeout(done, 100);
  });
});

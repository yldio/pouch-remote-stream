var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.it;
var Code = require('code');
var expect = Code.expect;

var Remote = require('../');

describe('listeners', function() {

  var remote = Remote();

  it('event with no listeners gets ignored', function(done) {
    var stream = remote.stream();
    stream.write(['_event', 'change', []]);
    setTimeout(done, 100);
  });

});

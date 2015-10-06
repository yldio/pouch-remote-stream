var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.it;
var Code = require('code');
var expect = Code.expect;
var Remote = require('../');
var PouchDB = require('pouchdb');
var async = require('async');

describe('max sequence', function() {

  PouchDB.adapter('remote', Remote.adapter);
  var remote = Remote({maxSeq: 3});
  var remoteDB = new PouchDB('dbname', {
    adapter: 'remote',
    remote: remote
  });


  it('max sequence will roll', function(done) {
    var stream = remote.stream()
    var expectedSeq = -1;
    var keys = ['a', 'b', 'c', 'd', 'e'];
    var count = 0;
    stream.on('data', function(d) {
      expectedSeq = (expectedSeq +1) % 4;
      var seq = d[0];
      expect(seq).to.equal(expectedSeq);
      if (++ count == keys.length) {
        done();
      }
    });
    async.each(keys, remoteDB.get.bind(remoteDB), allGot);

    function allGot(err) {
      expect(err).to.be.null();
    }
  });
});

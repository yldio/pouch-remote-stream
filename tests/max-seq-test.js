var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.it;
var Code = require('code');
var expect = Code.expect;
var Remote = require('../');
var PouchDB = require('pouchdb');
var async = require('async');
var EventEmitter = require('events');

describe('max sequence', function() {

  PouchDB.adapter('remote', Remote.adapter);
  var remote = Remote({maxSeq: 3});
  var remoteDB = new PouchDB('dbname', {
    adapter: 'remote',
    remote: remote
  });


  it('sequence will roll', function(done) {
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

  it('listener sequence will roll', function(done) {
    var id;
    var listener = new EventEmitter();
    for(var i = 0 ; i < 5 ; i ++) {
      id = remote.addListener(listener);
      expect(id).to.equal(i % 4);
    }
    var pending = 5;
    listener.on('change', function() {
      if (-- pending === 0) {
        done();
      }
    });
    var stream = remote.stream()
    for(var i = 0 ; i < 5 ; i ++) {
      stream.write(['_event', 'change', [i % 4, 'yay']]);
    }
  });
});

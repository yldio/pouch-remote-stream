var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.it;
var Code = require('code');
var expect = Code.expect;

var Remote = require('../');
var PouchDB = require('pouchdb');


describe('Adapter', function() {

  var remoteDB;

  it('can get installed into pouchdb', function(done) {
    PouchDB.adapter('remote', Remote.adapter);
    done();
  });

  it('remote db can be created', function(done) {
    remoteDB = new PouchDB({
      adapter: 'remote',
      name: 'mydb',
      remote: Remote()
    });
    done();
  });

  it('can be used to get a doc', function(done) {
    console.log('gettin');
    remoteDB.get('alice', function(err, result) {
      console.log('hey');
      done();
    });
  });

  //   server.inject('/cart', function(res) {
  //     expect(res.statusCode).to.be.equal(500);
  //     mock.done();
  //     done();
  //   });
  // });
});

// var Reconnect = require('reconnect-core');

// var reconnect = Reconnect(function(options) {
//   return net.connect(options.port, options.host);
// });

// var options = {
//   port: 80,
//   host: '127.0.0.1'
// };

// var re = reconnect(options, function(stream) {

//   var remote = Remote();

//   var remoteDB = new PouchDB({
//     adapter: 'remote',
//     name: 'mydb',
//     remote: remote
//   });

//   stream.pipe(remote).pipe(stream);

//   // use remoteDB

// });
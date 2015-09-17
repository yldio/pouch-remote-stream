var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.it;
var Code = require('code');
var expect = Code.expect;

var Remote = require('../');
var PouchDB = require('pouchdb');

var seq = -1;

describe('Adapter', function() {

  var remote;
  var remoteDB;

  it('can get installed into pouchdb', function(done) {
    PouchDB.adapter('remote', Remote.adapter);
    done();
  });

  it('remote db can be created', function(done) {
    remote = Remote();
    remoteDB = new PouchDB('dbname', {
      adapter: 'remote',
      remote: remote
    });
    done();
  });

  it('can be used to destroy a db', function(done) {
    var seq = sequence();
    var stream = remote.stream();
    stream.once('data', function(d) {
      expect(d).to.deep.equal([seq, 'dbname', 'destroy', []]);
      stream.write([seq, [null, {ok: true}]]);
    });
    remoteDB.destroy(function(err, result) {
      if (err) {
        done(err);
      }
      else {
        expect(result).to.deep.equal({ok: true});
        done();
      }
    });
  });

  it('can be used to put a doc', function(done) {
    var seq = sequence();
    var stream = remote.stream();

    stream.once('data', function(d) {
      expect(d).to.deep.equal([seq,"dbname","_bulkDocs",[{"docs":[{"_id":"id","a":1,"b":2}]},{"new_edits":true}]]);
      stream.write([seq, [null, {ok: true, id: 'id', rev: 1}]]);
    });

    remoteDB.put({_id: 'id', a:1,b:2}, function(err, result) {
      if (err) {
        done(err);
      }
      else {
        expect(result).to.deep.equal({ok: true, id: 'id', rev: 1});
        done();
      }
    });
  });


  it('can be used to get a doc', function(done) {
    var seq = sequence();
    var stream = remote.stream();
    stream.once('data', function(d) {
      expect(d).to.deep.equal([seq, 'dbname', 'get', ['alice']]);
      stream.write([seq, [null, {ok: true}]]);
    });
    remoteDB.get('alice', function(err, result) {
      if (err) {
        done(err);
      }
      else {
        expect(result).to.deep.equal({ok: true});
        done();
      }
    });
  });

  it('can be used to post a doc', function(done) {
    var seq = sequence();
    var stream = remote.stream();
    stream.once('data', function(d) {
      expect(d).to.deep.equal([seq, 'dbname', '_bulkDocs', [{"docs":[{"_id":"id","a":2,"b":3}]},{"new_edits":true}]]);
      stream.write([seq, [null, {ok: true, id: 'id', rev: 1}]]);
    });
    remoteDB.post({"_id":"id","a":2,"b":3}, function(err, result) {
      if (err) {
        done(err);
      }
      else {
        expect(result).to.deep.equal({ok: true, id: 'id', rev: 1});
        done();
      }
    });
  });

  it('can be used to remove a doc', function(done) {
    var seq = sequence();
    var stream = remote.stream();
    stream.once('data', function(d) {
      expect(d).to.deep.equal([seq, 'dbname', '_bulkDocs', [{docs: [
        {
          _id: 'id',
          _rev: 'rev',
          _deleted: true,
        }]},
        {
          was_delete: true,
          new_edits: true,
        }
        ]]);
      stream.write([seq, [null, {ok: true, id: 'id', rev: 2}]]);
    });
    remoteDB.remove('id', 'rev', function(err, result) {
      if (err) {
        done(err);
      }
      else {
        expect(result).to.deep.equal({ok: true, id: 'id', rev: 2});
        done();
      }
    });
  });

});


function xit() {}

function sequence() {
  return ++seq;
}
'use strict';

/* eslint func-names: 0 */

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.it;
var Code = require('code');
var expect = Code.expect;

var Remote = require('../');
var PouchDB = require('pouchdb');

var _seq = -1;

describe('Adapter', function() {
  var remote;
  var remoteDB;

  it('can get installed into pouchdb', function(done) {
    PouchDB.adapter('remote', Remote.adapter);
    done();
  });

  it('remote db cannot be created without remotes', function(done) {
    remote = Remote({});
    remoteDB = new PouchDB('dbname', {
      adapter: 'remote',
    });
    remoteDB.get('a', function(err) {
      expect(err).to.be.an.object();
      expect(err.message).to.equal('need a remote option');
      done();
    });
  });

  it('remote db can be created', function(done) {
    remote = Remote({});
    remoteDB = new PouchDB('dbname', {
      adapter: 'remote',
      remote: remote,
    });
    done();
  });

  it('can be used to destroy a db', function(done) {
    var seq = sequence();
    remote.stream.once('data', function(d) {
      expect(d).to.deep.equal([seq, 'dbname', 'destroy', []]);
      remote.stream.write([seq, [null, {ok: true}]]);
    });
    remoteDB.destroy(function(err, result) {
      if (err) {
        done(err);
      } else {
        expect(result).to.deep.equal({ok: true});
        done();
      }
    });
  });

  it('can be used to put a doc', function(done) {
    var seq = sequence();
    remote.stream.once('data', function(d) {
      expect(d).to.deep.equal([seq, 'dbname', '_bulkDocs', [{'docs': [{'_id': 'id', 'a': 1, 'b': 2}]}, {'new_edits': true}]]);
      remote.stream.write([seq, [null, {ok: true, id: 'id', rev: 1}]]);
    });

    remoteDB.put({_id: 'id', a: 1, b: 2}, function(err, result) {
      if (err) {
        done(err);
      } else {
        expect(result).to.deep.equal({ok: true, id: 'id', rev: 1});
        done();
      }
    });
  });


  it('can be used to get a doc', function(done) {
    var seq = sequence();
    remote.stream.once('data', function(d) {
      expect(d).to.deep.equal([seq, 'dbname', 'get', ['alice']]);
      remote.stream.write([seq, [null, {ok: true}]]);
    });
    remoteDB.get('alice', function(err, result) {
      if (err) {
        done(err);
      } else {
        expect(result).to.deep.equal({ok: true});
        done();
      }
    });
  });

  it('can be used to post a doc', function(done) {
    var seq = sequence();
    remote.stream.once('data', function(d) {
      expect(d).to.deep.equal([seq, 'dbname', '_bulkDocs', [{'docs': [{'_id': 'id', 'a': 2, 'b': 3}]}, {'new_edits': true}]]);
      remote.stream.write([seq, [null, {ok: true, id: 'id', rev: 1}]]);
    });
    remoteDB.post({'_id': 'id', 'a': 2, 'b': 3}, function(err, result) {
      if (err) {
        done(err);
      } else {
        expect(result).to.deep.equal({ok: true, id: 'id', rev: 1});
        done();
      }
    });
  });

  it('can be used to remove a doc', function(done) {
    var seq = sequence();
    remote.stream.once('data', function(d) {
      expect(d).to.deep.equal([
        seq, 'dbname', '_bulkDocs', [
          {
            docs: [
              {
                _id: 'id',
                _rev: 'rev',
                _deleted: true,
              },
            ],
          },
          {
            was_delete: true,
            new_edits: true,
          },
        ],
      ]);
      remote.stream.write([seq, [null, {ok: true, id: 'id', rev: 2}]]);
    });
    remoteDB.remove('id', 'rev', function(err, result) {
      if (err) {
        done(err);
      } else {
        expect(result).to.deep.equal({ok: true, id: 'id', rev: 2});
        done();
      }
    });
  });

  it('can be used to get all docs', function(done) {
    var resp = {
      'offset': 0,
      'total_rows': 1,
      'rows': [
        {
          'doc': {
            '_id': '0B3358C1-BA4B-4186-8795-9024203EB7DD',
            '_rev': '1-5782E71F1E4BF698FA3793D9D5A96393',
            'title': 'Sound and Vision',
            '_attachments': {
              'attachment/its-id': {
                'content_type': 'image/jpg',
                'data': 'R0lGODlhAQABAIAAAP7//wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==',
                'digest': 'md5-57e396baedfe1a034590339082b9abce',
              },
            },
          },
          'id': '0B3358C1-BA4B-4186-8795-9024203EB7DD',
          'key': '0B3358C1-BA4B-4186-8795-9024203EB7DD',
          'value': {
            'rev': '1-5782E71F1E4BF698FA3793D9D5A96393',
          },
        },
      ],
    };

    var seq = sequence();
    remote.stream.once('data', function(d) {
      expect(d).to.deep.equal([seq, 'dbname', 'allDocs', []]);
      remote.stream.write([seq, [null, resp]]);
    });

    remoteDB.allDocs(function(err, results) {
      if (err) {
        done(err);
      } else {
        expect(results).to.deep.equal(resp);
        done();
      }
    });
  });

  it('can listen to changes', function(done) {
    var changes = [
      {
        'id': 'doc1',
        'changes': [ { 'rev': '1-9152679630cc461b9477792d93b83eae' } ],
        'doc': {
          '_id': 'doc1',
          '_rev': '1-9152679630cc461b9477792d93b83eae',
        },
        'seq': 1,
      },
      {
        'id': 'doc2',
        'changes': [ { 'rev': '2-9b50a4b63008378e8d0718a9ad05c7af' } ],
        'doc': {
          '_id': 'doc2',
          '_rev': '2-9b50a4b63008378e8d0718a9ad05c7af',
          '_deleted': true,
        },
        'deleted': true,
        'seq': 3,
      },
    ];
    var curSeq = -1;

    var seq = sequence();
    remote.stream.once('data', function(_d) {
      var d = JSON.parse(JSON.stringify(_d));
      expect(d).to.deep.equal([seq, 'dbname', '_changes', [0, {'since': 0, 'descending': false}]]);
      remote.stream.write([seq, [null, {ok: true}]]);

      changes.forEach(function(change) {
        remote.stream.write(['_event', 'change', [0, change]]);
      });
      remote.stream.write(['_event', 'complete', [0]]);
    });

    var feed = remoteDB.changes();

    feed.on('change', function(change) {
      curSeq ++;
      expect(change).to.deep.equal(changes[curSeq]);
    });

    feed.once('complete', function(results) {
      expect(curSeq).to.equal(changes.length - 1);
      expect(results).to.deep.equal({results: changes, last_seq: 3});
      done();
    });
  });

  it('can listen to a changes feed that errors', function(done) {
    var feed = remoteDB.changes();
    sequence();

    feed.once('error', function(err) {
      expect(err).to.be.an.object();
      expect(err.message).to.equal('ouch');
      done();
    });

    setTimeout(function() {
      remote.stream.write(['_event', 'error', [1, {message: 'ouch'}]]);
    }, 100);
  });

  it('can listen to changes live', function(done) {
    var changes = [
      {
        'id': 'doc1',
        'changes': [ { 'rev': '1-9152679630cc461b9477792d93b83eae' } ],
        'doc': {
          '_id': 'doc1',
          '_rev': '1-9152679630cc461b9477792d93b83eae',
        },
        'seq': 1,
      },
      {
        'id': 'doc2',
        'changes': [ { 'rev': '2-9b50a4b63008378e8d0718a9ad05c7af' } ],
        'doc': {
          '_id': 'doc2',
          '_rev': '2-9b50a4b63008378e8d0718a9ad05c7af',
          '_deleted': true,
        },
        'deleted': true,
        'seq': 3,
      },
    ];
    var curSeq = -1;

    var seq = sequence();

    remote.stream.once('data', function(_d) {
      var d = JSON.parse(JSON.stringify(_d));
      expect(d).to.deep.equal([seq, 'dbname', '_info', []]);
      remote.stream.write([seq, [null, { doc_count: 0, update_seq: 0, backend_adapter: 'LevelDOWN' }]]);

      seq = sequence();

      remote.stream.once('data', function(_d2) {
        var d2 = JSON.parse(JSON.stringify(_d2));
        expect(d2).to.deep.equal([seq, 'dbname', '_changes', [2, {'live': true, 'continuous': true, 'since': 0, 'descending': false}]]);
        remote.stream.write([seq, [null, {ok: true}]]);

        changes.forEach(function(change) {
          remote.stream.write(['_event', 'change', [2, change]]);
        });
      });
    });

    var feed = remoteDB.changes({live: true});

    feed.on('change', function(change) {
      curSeq ++;
      expect(change).to.deep.equal(changes[curSeq]);
      if (curSeq === changes.length - 1) {
        done();
      }
    });
  });
});


function sequence() {
  return ++_seq;
}

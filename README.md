# pouch-remote-stream

[![By](https://img.shields.io/badge/made%20by-yld!-32bbee.svg?style=flat)](http://yld.io/contact?source=github-nock)
[![Build Status](https://secure.travis-ci.org/pgte/pouch-remote-stream.svg)](http://travis-ci.org/pgte/pouch-remote-stream)

Consume a remote [PouchDB](http://pouchdb.com/) stream.

Goes well with [`pouch-stream-server`](https://github.com/pgte/pouch-stream-server) on the server side.


## PouchDB versions

Tested against PouchDB version 5.

## Install

```
$ npm install pouch-remote-stream --save
```


## Getting started

### 1. Require it

```js
var Remote = require('pouch-remote-stream');
```

### 2. Add the PouchDB adapter

```
PouchDB.adapter('remote', Remote.adapter);
```

### 3. Create the remote

```js
var remote = Remote();
```

### 4. Create the remote PouchDB database

```js
var remoteDB = new PouchDB('mydb', {
  adapter: 'remote',
  remote: remote 
});
```

### 5. Pipe it to and from a duplex stream

```js
var stream = somehowCreateSomeDuplexStream();

stream.pipe(remote.stream()).pipe(stream);
```

### 6. Use the PouchDB remote DB

, for example to sync a local DB:

```js
var localDB = new PouchDB('someLocalDB');
localDB.sync(remoteDB);
```


## Any stream, really

You can pipe it to and from any duplex object stream.


## Encode and decode streams

If you need to work with a raw duplex stream (like a TCP or a web socket), you will need to encode and decode the stream. For example, you can use a new-line separated JSON duplex stream like this:

```js
var JSONDuplexStream = require('json-duplex-stream');

var JSONStream = JSONDuplexStream();

var rawDuplexStream = createRawStreamSomehow();

// raw => JSON.in => remote.stream => JSON.out => raw

rawDuplexStream.
  pipe(JSONStream.in).
  pipe(remote.stream).
  pipe(JSONStream.out).
  pipe(rawDuplexStream);
```

## You can use with reconnect:

Here's an example of using a TCP stream and reconnecting if the connection goes down:

```js
var Remote = require('pouch-remote-stream');
PouchDB.adapter('remote', Remote.adapter);
var Reconnect = require('reconnect-core');

var reconnect = Reconnect(function(options) {
  return net.connect(options.port, options.host);
});

var options = {
  port: 80,
  host: '127.0.0.1'
};

var re = reconnect(options, function(stream) {
  var remote = Remote();

  var remoteDB = new PouchDB('mydb', {
    adapter: 'remote',
    remote: remote 
  });

  stream.pipe(remote.stream).pipe(stream);

  // use remoteDB

});
```

# License

ISC
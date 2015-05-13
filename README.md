# pouch-remote-stream

PouchDB remote streams, client and server.

Heavily based on [nolanlawson/socket-pouch](https://github.com/nolanlawson/socket-pouch).

## Install

```
$ npm install pouch-remote-stream
```

## Use

### Client

```js
var PouchDB = require('pouchdb');
var PouchRemoteStream = require('pouch-remote-stream');
PouchDB.adapter('remote', PouchRemoteStream.adapter);

var stream = require('net').connect(port, host);
var remote = PouchRemoteStream();
stream.pipe(remote).pipe(stream);

var remoteDB = new PouchDB({
  adapter: 'remote',
  name: 'mydb',
  remote: remote 
});
```

### Server

```js
var PouchServerStream = require('pouch-remote-stream/server');

var server = require('net').createServer(function(conn) {
  conn.pipe(PouchServerStream()).pipe(conn);
});
```


## Debug

### Node

Enable debug output by setting environment variable `DEBUG` to `pouchdb:remotestream:*`.


### Browser

In the browser, you can enable debugging by using PouchDB's logger:

```js
PouchDB.debug.enable('pouchdb:remotestream:*');
```

# License

ISC
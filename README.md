# pouch-remote-stream

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
stream.pipe(remote, {end: false}).pipe(stream);

var remoteDB = new PouchDB({
  adapter: 'remote',
  name: 'mydb',
  remote: remote 
});
```

### Server

```js
var PouchRemoteStream = require('pouch-remote-stream/server');

var server = require('net').createServer(function(conn) {
  conn.pipe(PouchRemoteStream()).pipe(conn);
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
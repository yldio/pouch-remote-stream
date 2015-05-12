# pouch-remote-stream

## Install

```
$ npm install pouch-remote-stream
```

## Use

```js
var PouchDB = require('pouchdb');
var PouchRemoteStream = require('pouch-remote-stream');
PouchDB.adapter('remote', PouchRemoteStream.adapter);

var stream = require('websocket-stream')('ws://yourserver.com');
var remote = PouchRemoteStream();
stream.pipe(remote, {end: false}).pipe(stream);

var remoteDB = new PouchDB({
  adapter: 'remote',
  name: 'mydb',
  remote: remote 
});
```

## Debug

### Node

Enable debug output by setting environment variable `DEBUG` to `pouch-remote-stream:*`.


### Browser

In the browser, you can enable debugging by using PouchDB's logger:

```js
PouchDB.debug.enable('pouchdb:socket:*');
```

# License

ISC
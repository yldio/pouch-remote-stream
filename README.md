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

Enable debug output by setting environment variable `DEBUG` to `pouch-remote-stream:*`.


# License

ISC
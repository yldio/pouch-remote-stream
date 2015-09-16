# pouch-remote-client-stream

Remote PouchDB stream

## Use with reconnect:

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

  var remoteDB = new PouchDB({
    adapter: 'remote',
    name: 'mydb',
    remote: remote 
  });

  stream.pipe(remote.stream()).pipe(stream);

  // use remoteDB

});
```
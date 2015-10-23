# pouch-remote-stream

Consume a remote [PouchDB](http://pouchdb.com/) stream.

Goes well with [`pouch-stream-server`](https://github.com/pgte/pouch-stream-server) on the server side.


## Install

```
$ npm install pouch-remote-stream --save
```


## Getting started

Require it:

```js
var Remote = require('pouch-remote-stream');
```

Add the PouchDB adapter:

```
PouchDB.adapter('remote', Remote.adapter);
```

Create the remote:

```js
var remote = Remote();
```

Create the remote PouchDB database:

```js
var remoteDB = new PouchDB('mydb', {
  adapter: 'remote',
  remote: remote 
});
```

Pipe it to and from a duplex stream:

```js
var stream = somehowCreateSomeDuplexStream();

stream.pipe(remote.stream).pipe(stream);
```

Use the PouchDB remote DB, for example to sync a local DB:

```js
var localDB = new PouchDB('someLocalDB');
localDB.sync(remoteDB);
```


## Use with reconnect:

Here's an example of using it through a TCP stream:

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

  stream.pipe(remote.stream()).pipe(stream);

  // use remoteDB

});
```

# License

ISC
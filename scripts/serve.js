var connect = require('connect');

var port = 8888;
connect.createServer(connect.static(__dirname)).listen(port);
console.log('Serving current directory on port '+port+'...');

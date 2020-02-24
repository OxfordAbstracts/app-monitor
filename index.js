var forever = require('forever-monitor');

const file = 'monitor.js';
 
var child = new (forever.Monitor)(file, {
  args: []
});

child.on('exit', function () {
  console.log(`${file} has exited`);
});

child.start();
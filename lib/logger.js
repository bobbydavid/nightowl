var fs = require('fs'),
    csv = require('csv');

var COLUMNS = ['date', 'type', 'note'];

var Logger = function(fd) {
  this.fd = fd;
};

Logger.prototype.log = function(type, opt_note, next) {
  if (typeof(opt_note) == 'function') {
    next = opt_note;
    opt_note = undefined;
  }

  var fd = this.fd;
  var row = {
    date: Date(),
    type: type,
    note: opt_note
  };
  csv().from.array([row], { columns: COLUMNS })
       .to.options({ eof: '\n', end: false })
       .to(function(rowString) {
          var buf = new Buffer(rowString, 'utf8');
          fs.write(fd, buf, 0, buf.length, null, next);
       });
};


var loadSync = exports.loadSync = function(logfile) {
  if (logfile[0] != '/') { logfile = process.cwd() + '/' + logfile; }

  var logfile_exists = fs.existsSync(logfile);
  var fd = fs.openSync(logfile, 'a', 0644);
  if (!logfile_exists) {
    // Write the names of the columns if the file did not previously exist.
    var buf = new Buffer(COLUMNS.join(',') + '\n', 'utf8');
    fs.writeSync(fd, buf, 0, buf.length);
  }

  return new Logger(fd);
};

var fs = require('fs'),
    path = require('path'),
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

// Throw error unless we are the main program.
if (require.main === module) {
  var argv = process.argv;
  var offset = (path.basename(argv[0]) == 'node') ? 2 : 1;
  if (argv.length - offset < 2) {
    console.log('Usage: ' + argv.join(' ') + ' {event} {logfile}');
    process.exit(1);
  }
  var eventName = argv[offset];
  var logfile = argv[offset + 1];

  var logpath = path.dirname(logfile);
  if (!fs.existsSync(logpath)) {
    console.log('Bad file path "' + logfile + '": ' +
                'containing directory "' + logpath + '" does not exist.');
    process.exit(1);
  }

  var logger = loadSync(logfile);
  logger.log(eventName);
}


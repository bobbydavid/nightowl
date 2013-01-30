
var fs = require('fs'),
    csv = require('csv');


var CONFIG_FILE = __dirname + '/config.json',
    EXPECTED_CONFIG = ['logfile'],
    COLUMNS = ['date', 'type', 'uid', 'misc'];

// Load tlog config file.
var configFile = fs.readFileSync(CONFIG_FILE, 'utf8');
var config = JSON.parse(configFile);
for (var i in EXPECTED_CONFIG) {
  if (typeof(config[EXPECTED_CONFIG[i]]) == 'undefined') {
    throw "Config file missing key: '" + EXPECTED_CONFIG[i] + "'.";
  }
}

// Set the log file path.
var logfilePath = config.logfile;
if (logfilePath[0] != '/') {
  logfilePath = __dirname + '/' + logfilePath;
}

/*
// Open the log file as a stream for appending. Add the column headings if
// appropriate.
if (config.logfile[0] != '/') {
  config.logfile = __dirname + '/' + config.logfile;
}
var logfile_exists = fs.existsSync(config.logfile);
var logstream = fs.createWriteStream(config.logfile, {
  flags: 'a', encoding: 'utf8', mode: 0644
});
if (!logfile_exists) {
  logstream.write(COLUMNS.join(',') + '\n');
}
*/

/*
// Open the log file for append.
var openLogStream = function(next) {
  fs.exists(logfilePath, function(exists) {
    var wStream = fs.createWriteStream(logfilePath, {
      flags: 'a', encoding: 'utf8', mode: 0644
    });
    if (exists) {
      wStream.write(COLUMNS.join(','), '\n');
    }
    next(wStream);
  });
};
*/
var openLogStreamSync = function(path) {
  var exists = fs.existsSync(path);
  var logStream = fs.createWriteStream(path, {
    flags: 'a', encoding: 'utf8', mode: 0644
  });
  if (!exists) {
    logStream.write(COLUMNS.join(',') + '\n');
  }
  return logStream;
};

var logStream = openLogStreamSync(logfilePath);

var log = module.exports.log = function(type, opt_uid, opt_misc) {
  var row = {
    date: Date(),
    type: type,
    uid: opt_uid ? opt_uid : undefined,
    misc: ('undefined' == typeof(opt_misc)) ?
          undefined : JSON.stringify(opt_misc)
  };
  csv().from.array([row], { columns: COLUMNS })
       .to.options({ eof: true, end: false })
       .to.stream(logStream);
}

/*
var close = module.exports.close = function() {
  logstream.end();
}
*/

if (require.main === module) {
  var argv = process.argv.slice(2);
  if (1 != argv.length) {
    throw "Error: currently can only handle event specified but no data.";
  } else {
    var type = argv[0];
    var data = argv.length > 1 ? process.argv.slice(1).join(' ') : undefined;
    log(type, data);
  }
}

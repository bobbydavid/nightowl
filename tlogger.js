
var fs = require('fs'),
    csv = require('csv');


var CONFIG_FILE = 'config.json',
    EXPECTED_CONFIG = ['logfile'],
    COLUMNS = ['date', 'type', 'data'];

// Load tlog config file.
var configFile = fs.readFileSync(CONFIG_FILE, 'utf8');
var config = JSON.parse(configFile);
for (var i in EXPECTED_CONFIG) {
  if (typeof(config[EXPECTED_CONFIG[i]]) == 'undefined') {
    throw "Config file missing key: '" + EXPECTED_CONFIG[i] + "'.";
  }
}

// Open the log file as a stream for appending. Add the column headings if
// appropriate.
var logfile_exists = fs.existsSync(config.logfile);
var logstream = fs.createWriteStream(config.logfile, {
  flags: 'a', encoding: 'utf8', mode: 0644
});
if (!logfile_exists) {
  logstream.write(COLUMNS.join(',') + '\n');
}

var log = module.exports.log = function(type, opt_data, opt_callback) {
  var row = [[Date(), type, JSON.stringify(opt_data)]];
  csv()
      .from.array(row, { columns: ['date', 'type', 'data'] })
      .to.stream(logstream, { eof: true, end: false });
}

var close = module.exports.close = function() {
  logstream.end();
}

if (require.main === module) {
  var argv = process.argv.slice(2);
  if (1 != argv.length) {
    throw "Error: currently can only handle event specified but no data.";
  } else {
    log(argv[0]);
  }
}

var screenEventer = require('./screenEventer'),
    fs = require('fs'),
    path = require('path'),
    loggerFactory = require('./logger');

var monitor = exports.monitor = function(eventer, logger) {
  var logComment = function(msg) { logger.log('COMMENT', msg); };
  var logLock = function() { logger.log('SCREEN_LOCK'); };
  var logUnlock = function() { logger.log('SCREEN_UNLOCK'); };

  var listeners = {
    'message': logComment,
    'lock': logLock,
    'unlock': logUnlock
  };

  for (key in listeners) {
    eventer.on(key, listeners[key]);
  }
  eventer.once('stopping', function() {
    logger.log('STOPPING');
    for (key in listeners) {
      eventer.removeListener(key, listeners[key]);
    }
  })
};

var logStop = function() {
  logger.log('STOPPING');
};

var startMonitor = function(eventer, logfile) {
  var logger = loggerFactory.loadSync(logfile);

  logger.log('STARTING');
  monitor(eventer, logger);

  ['SIGHUP', 'SIGINT', 'SIGTERM'].forEach(function(sig) {
    process.on(sig, function() {
      // TODO: stop dbus-monitor here?
      logger.log(sig);
      eventer.emit('stopping');  // Force the monitoring to stop.
    })
  });
};

// Throw error unless we are the main program.
if (require.main === module) {
  var argv = process.argv;
  var offset = (path.basename(argv[0]) == 'node') ? 2 : 1;
  if (argv.length < 2 + offset) {
    console.log('Usage: ' + argv.join(' ') + ' [gnome] {logfile path}');
    process.exit(1);
  }
  var windowManager = argv[offset];
  var logfile = argv[offset + 1];

  var logpath = path.dirname(logfile);
  if (!fs.existsSync(logpath)) {
    console.log('Bad file path "' + logfile + '": ' +
                'containing directory "' + logpath + '" does not exist.');
    process.exit(1);
  }

  switch (windowManager) {
    case 'gnome':
      startMonitor(new screenEventer.Gnome(), logfile);
      break;
    default:
      console.log('Unknown window manager: ' + windowManager);
      process.exit(1);
  }
}


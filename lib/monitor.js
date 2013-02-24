var Tlogger = require('./tlogger'),
    spawn = require('child_process').spawn;

var dbus;

var spawnDbusMonitor = function() {
  var BINARY = 'dbus-monitor';
  dbus = spawn(BINARY, ['--session', [
    'type=signal',
    'interface=org.gnome.ScreenSaver',
    'member=ActiveChanged'
  ].join(',')]);
  dbus.stdout.setEncoding('utf8');
  dbus.stderr.setEncoding('utf8');
  dbus.stderr.on('data', function(data) {
    Tlogger.log('COMMENT', null, 'dbus-monitor error: ' + data);
  });
  dbus.on('exit', function(code) {
    var error;
    switch (code) {
      case null:
      case 0:
      case '0':
        // These are expected ways for BINARY to exit -- do nothing.
        return;
      case 127:
        error = 'Could not find ' + BINARY + '. Are we currently in Gnome?';
        break;
      default:
        error = 'Oops! ' + BINARY + ' exited with code ' + code + '.';
    }
    Tlogger.log('COMMENT', null, error);
  });
  return dbus;
};

var exitAndLog = function(type) {
  Tlogger.log(type, process.pid);
  dbus.kill();
};

var monitor = module.exports = function() {
  Tlogger.log('LOGIN', process.pid);

  var dbus = spawnDbusMonitor();
  dbus.stdout.on('data', function(data) {
    if (data.indexOf('boolean true') >= 0) {
      Tlogger.log('SCREEN_LOCKED');
    } else if (data.indexOf('boolean false') >= 0) {
      Tlogger.log('SCREEN_UNLOCKED');
    }

    if (data.indexOf('Disconnected') >= 0) {
      exitAndLog('LOGOUT');
    }
  });
};

if (require.main === module) {
  monitor();

  ['SIGHUP', 'SIGINT', 'SIGTERM'].forEach(function(sig) {
    process.on(sig, function() {
      exitAndLog(sig);
    });
  });
}

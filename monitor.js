var Tlogger = require('./tlogger'),
    spawn = require('child_process').spawn;

function spawnDbusMonitor() {
  var BINARY = 'dbus-monitor';
  var dbus = spawn(BINARY, ['--session', ['type=signal',
                                          'interface=org.gnome.ScreenSaver',
                                          'member=ActiveChanged'].join(',')]);
  dbus.stdout.setEncoding('utf8');
  dbus.stderr.setEncoding('utf8');
  dbus.stderr.on('data', function(data) {
    console.log('dbus-monitor error: ' + data);
    process.exit(1);
  });
  dbus.on('exit', function(code) {
    var error;
    switch (code) {
      case 127:
        error = 'Could not find ' + BINARY + '. Are we currently in Gnome?';
        break;
      default:
        error = 'Oops! ' + BINARY + ' exited with code ' + code + '.';
    }
    console.log(error);
    process.exit(1);
  });
  return dbus;
}

// TODO: catch SIGHUP, SIGTERM, SIGKILL, or whatever, and log that they
// happened.
var monitor = module.exports = function() {
  Tlogger.log('LOGIN', { pid: process.pid, term: process.env['TERM'] });

  var dbus = spawnDbusMonitor();
  dbus.stdout.on('data', function(data) {
    console.log('------');
    console.log(data);
    if (data.indexOf('boolean true') >= 0) {
      Tlogger.log('SCREEN_LOCKED');
    } else if (data.indexOf('boolean false') >= 0) {
      Tlogger.log('SCREEN_UNLOCKED');
    }

    if (data.indexOf('Disconnected') >= 0) {
      Tlogger.log('LOGOUT', { pid: process.pid, term: process.env['TERM'] });
      Tlogger.close();
      exit(0);
    }
  });
};

if (require.main === module) {
  monitor();
}

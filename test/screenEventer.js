var chai = require('chai'),
    events = require('events'),
    assert = chai.assert,
    fs = require('fs');

chai.Assertion.includeStack = true;

var screenEventer = require('../lib/screenEventer');

describe('screenEventer', function() {
  describe('Gnome', function() {
    it('can be created without a warning', function(done) {
      var monitor = new screenEventer.Gnome();
      monitor.on('error', function(msg) {
        assert.fail(msg, null, msg);
      });

      // Wait a bit to make sure no error events occur.
      setTimeout(done, 200);
    });

    // TODO: tests for screen event monitor. This may require a mock
    //       dbus-monitor.
  });
});

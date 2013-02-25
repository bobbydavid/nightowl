var chai = require('chai'),
    assert = chai.assert,
    fs = require('fs');

chai.Assertion.includeStack = true;

var monitor = require('../lib/monitor');

describe('monitor', function() {
  it('should log a message on an error', function(){
    // TODO
  });

  it('should log a message on screen lock and unlock', function(){
    // TODO
  });

  it('should log a message on logout', function(){
    // TODO
  });

  it('should stop logging after a stopping event', function() {
    // TODO
  });

  describe('Main', function() {
    it('should append a login event', function() {
      // TODO
    });

    it('should record an event on signals', function() {
      // TODO
    });

    // TODO: others?
  });
});


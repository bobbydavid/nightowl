var chai = require('chai'),
    assert = chai.assert,
    fs = require('fs');

chai.Assertion.includeStack = true;

var loggerFactory = require('../lib/logger');

describe('loggerFactory', function() {
  var TEMP_LOG = 'test/tmp_events.csv';

  var assertNoLog = function() {
    assert.isFalse(fs.existsSync(TEMP_LOG),
        'Temporary CSV file "' + TEMP_LOG + '" already exists. This is ' +
        'most likely because a bug in the test did not delete it the ' +
        'previous time it was run');
  };

  var checkLog = function(next) {
    fs.readFile(TEMP_LOG, 'utf8', function(err, data) {
      assert.isNull(err);
      var lines = data.split('\n');
      assert.equal(lines.pop(), ''); // Remove the trailing newline.
      next(lines);
    });
  };

  describe('#loadSync()', function() {
    it('should create a non-existant csv file', function(done) {
      assertNoLog();
      var logger = loggerFactory.loadSync(TEMP_LOG);
      assert.isTrue(fs.existsSync(TEMP_LOG));
      fs.readFile(TEMP_LOG, 'utf8', function(err, data) {
        assert.isNull(err);
        assert.equal(data, 'date,type,note\n');
        done();
      });
    });

    it('should append to existing csv file', function(done) {
      assert.isTrue(fs.existsSync(TEMP_LOG)); // File exists from previous test.
      var logger = loggerFactory.loadSync(TEMP_LOG);
      logger.log('COMMENT', function(err) {
        assert.isNull(err);
        checkLog(function(lines) {
          assert.equal(lines.length, 2);
          assert.match(lines[1], /,COMMENT,$/);
          done();
        });
      });
    });

    after(function() {
      assert.isTrue(fs.existsSync(TEMP_LOG));
      fs.unlinkSync(TEMP_LOG);
      assert.isFalse(fs.existsSync(TEMP_LOG));
    });
  });

  describe('Logger', function() {
    beforeEach(function(){
      assertNoLog();
      this.logger = loggerFactory.loadSync(TEMP_LOG);
      assert.isTrue(fs.existsSync(TEMP_LOG));
    });

    afterEach(function() {
      assert.isTrue(fs.existsSync(TEMP_LOG));
      fs.unlinkSync(TEMP_LOG);
      assert.isFalse(fs.existsSync(TEMP_LOG));
    });

    it('should append comments', function(done) {
      this.logger.log('COMMENT', 'blargh', function(err) {
        checkLog(function(lines) {
          assert.equal(lines.length, 2);
          assert.match(lines[1], /,COMMENT,blargh$/);
          done();
        });
      });
    });

    it('should order comments correctly', function(done) {
      var remaining = 3;
      var callback = function(err) {
        assert.isNull(err);
        --remaining || checkLog(function(lines) {
          assert.equal(lines.length, 4);
          assert.match(lines[1], /,COMMENT,first$/);
          assert.match(lines[2], /,COMMENT,second$/);
          assert.match(lines[3], /,COMMENT,third$/);
          done();
        });
      };
      this.logger.log('COMMENT', 'first', callback);
      this.logger.log('COMMENT', 'second', callback);
      this.logger.log('COMMENT', 'third', callback);
    });
  });

  describe('Main', function() {
    // TODO: When called as the main library, the logger should parse command
    //       line arguments and log them.
  });
});

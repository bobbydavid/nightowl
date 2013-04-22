(function(window) {
  var SECONDS_PER_DAY = 86400;

  var assert = function(x) {
    if (!x) {
      throw "Assertion failed.";
    }
  };

  var render = window.render = function(config) {
    d3.csv(config.csvFile, function(events) {
      if (!events) {
        throw 'Error: no events found. Does "' + config.csvFile + '" exist?';
      } else {
        var machine = new renderMachine(events, config);
        machine.drawAxes();
        machine.mapEventsToShapes();
        machine.drawShapes();
      }
    });
  };

  var DAY_LINE_HEIGHT = 20;
  var HORIZONTAL_AXIS_PAD = 100;
  var VERTICAL_AXIS_PAD = 100;
  var GUTTER = 10;

  var renderMachine = function(events, config) {
    this.events_ = events;
    this.config_ = config;

    // Parse each of the dates in the events from strings to Date objects.
    for (var i in events) {
      events[i].date = new Date(events[i].date);
    }

    // Sort the events by date.
    events.sort(function(d1, d2) {
      return d1.date - d2.date;
    });

    // Calculate the day/location that each event occurred on, and add it to
    // each event object.
    var dateParser = newDateParser(events[0].date);
    for (var i in events) {
      var tmp = dateParser(events[i].date);
      events[i].day = tmp.day;
      events[i].location = tmp.location;
    }
    this.dayCount_ = events[events.length - 1].day + 1;

    // Determine the size of the viewing area.
    this.HEIGHT_ = DAY_LINE_HEIGHT * this.dayCount_;
    this.WIDTH_ = config.width - (2 * GUTTER + HORIZONTAL_AXIS_PAD);
    if (!(this.WIDTH_ > 0)) { throw "width must be positive integer."; }

    // Create the SVG element.
    this.svg_ = d3.select(config.svgHolder).append('svg')
        .attr('class', config.svgClass)
        .attr('width', GUTTER + VERTICAL_AXIS_PAD + this.WIDTH_ + GUTTER)
        .attr('height', GUTTER + HORIZONTAL_AXIS_PAD + this.HEIGHT_ + GUTTER);

    // Create containers for axes, dots, and lines.
    this.gXAxis_ = this.svg_.append('g').attr('id', 'gXAxis'),
    this.gYAxis_ = this.svg_.append('g').attr('id', 'gYAxis'),
    this.gDots_ = this.svg_.append('g').attr('id', 'gDots'),
    this.gLines_ = this.svg_.append('g').attr('id', 'gLines');

    // Determine the scale based on the size of the SVG element: try to fill
    // the entire box.
    this.xScale_ = d3.scale.linear()
        .domain([0, SECONDS_PER_DAY])
        .range([GUTTER + VERTICAL_AXIS_PAD, GUTTER + VERTICAL_AXIS_PAD + this.WIDTH_]);
    this.yScale_ = d3.scale.linear()
        .domain([0, this.dayCount_])
        .range([GUTTER + HORIZONTAL_AXIS_PAD, GUTTER + HORIZONTAL_AXIS_PAD + this.HEIGHT_]);
  };

  renderMachine.prototype.drawAxes = function() {
    var self = this;
    var vertAxisHeightScale = d3.scale.linear()
        .domain([0, 1]).range([GUTTER, GUTTER + VERTICAL_AXIS_PAD]);
    var horzAxisHeightScale = d3.scale.linear()
        .domain([0, 1]).range([GUTTER, GUTTER + HORIZONTAL_AXIS_PAD]);

    // Horizontal axis (counting the hours)
    /*
    this.gAxes_.append('rect')
        .attr('x', horzAxisHeightScale(1))
        .attr('y', vertAxisHeightScale(0))
        .attr('width', this.xScale_(SECONDS_PER_DAY) - this.xScale_(0))
        .attr('height', horzAxisHeightScale(1) - horzAxisHeightScale(0))
        .attr('fill', '#eee');
    */
    // TODO: use d3's `axis()` method. See:
    //       http://alignedleft.com/tutorials/d3/axes/
    var hours = ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am',
                 '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm',
                 '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm', '12am'];
    this.gXAxis_.selectAll('line')
        .data(hours)
        .enter().append('line')
            .attr('x1', function(d, i) { return self.xScale_(i * 3600); })
            .attr('y1', function(d, i) { return self.yScale_(0); })
            .attr('x2', function(d, i) { return self.xScale_(i * 3600); })
            .attr('y2', function(d, i) { return self.yScale_(self.dayCount_); })
            .attr('class', 'vertical-tick')
    this.gXAxis_.selectAll('text')
        .data(hours)
        .enter().append('text')
            .attr('transform', function(d, i) {
                return 'rotate(-90 ' +
                       self.xScale_(i * 3600) + ',' +
                       self.yScale_(0) + ')'; })
            .attr('x', function(d, i) { return self.xScale_(i * 3600) + 5; })
            .attr('y', function(d, i) { return self.yScale_(0) + 4; })
            .text(function(d) { return d; });

    // Vertical axis (counting the days)
    /*
    this.gAxes_.append('rect')
        .attr('x', horzAxisHeightScale(0))
        .attr('y', vertAxisHeightScale(1))
        .attr('width', vertAxisHeightScale(1) - vertAxisHeightScale(0))
        .attr('height', this.yScale_(this.dayCount_) - this.yScale_(0))
        .attr('fill', '#eee');
    */
    /*
    var yAxis = d3.svg.axis()
        .scale(this.yScale_)
        .orient('left')
        .ticks(this.dayCount_ - 1);
    this.gYAxis_
        .attr('transform', 'translate(' + horzAxisHeightScale(1) + ',0)')
        .call(yAxis);
    */
  };

  renderMachine.prototype.mapEventsToShapes = function() {
    this.lines_ = [];
    this.dots_ = [];

    // Create lines when the screen is on/off.
    var openLogins = [];
    var lastEvent = null;
    for (var i = 0; i < this.events_.length; i++) {
      var e = this.events_[i];
      if (lastEvent && lastEvent.day != e.day) {
        if (e.type == 'SCREEN_LOCK') {
          console.log(e);
        }
        lastEvent = e;
        continue;
      }
      switch (e.type) {
        case 'STARTING':
          if (lastEvent && lastEvent.day == e.day) {
            this.addLine_(lastEvent, e, 'loggedOut', 'Logged out');
          }
          openLogins.push(e);
          break;
        case 'SCREEN_UNLOCK':
          if (lastEvent && lastEvent.day == e.day) {
            this.addLine_(lastEvent, e, 'screenOff', 'Screen off');
          }
          break;
        case 'STOPPING':
          openLogins.pop(); // TODO: find by UID instead of top of stack.
          this.addLine_(lastEvent, e, 'screenOn', 'Screen on');
          break;
        case 'SCREEN_LOCK':
          this.addLine_(lastEvent, e, 'screenOn', 'Screen on');
          break;
        case 'PRODACCESS':
          // Unknown event type: create a dot instead.
          this.dots_.push({
            day: e.day,
            location: e.location,
            color: '#33e',
            text: e.type + ' at ' + e.date
          });
          continue;  // Break instead of continue to avoid updating lastEvent.
        default:
          throw 'Unknown event type: ' + e.type + ' at ' + e.date;
      }
      lastEvent = e;
    };
  };

  // The next number to use when adding a line.
  renderMachine.prototype.nextLineId_ = 0;

  renderMachine.prototype.addLine_ = function(fromE, toE, classes, msg) {
    // TODO: Add support for lines that span multiple days.
    if (fromE.day != toE.day) {
        console.log('---');
        console.log(fromE);
        console.log(toE);
        throw "Cannot support lines across multiple days.";
    }

    this.lines_.push({
      day: fromE.day,
      start: fromE.location,
      end: toE.location,
      text: msg + ' for ' + this.formatTime_(toE.location - fromE.location) + ' on ' + fromE.date,
      classes: classes + ' lineSet' + this.nextLineId_++
    });
  };

  renderMachine.prototype.formatTime_ = function(seconds) {
    var minutes = Math.ceil(seconds / 60) % 60; // Round up minutes.
    var hours = Math.floor(seconds / 3600);

    var parts = [];
    if (hours > 0) {
      parts.push(hours + ' hour' + (1 == hours ? '' : 's'));
    }
    if (hours == 0 || minutes > 0) {
      parts.push(minutes + ' minute' + (1 == minutes ? '' : 's'));
    }
    return parts.join(' ');
  };

  renderMachine.prototype.drawShapes = function() {
    var xScale = this.xScale_,
        yScale = this.yScale_;

    var LINE_PADDING = 0.1;  // days
    this.gLines_.selectAll('rect')
        .data(this.lines_)
        .enter().append('rect')
            .attr('x', function(d) { return xScale(d.start); })
            .attr('y', function(d) { return yScale(d.day + LINE_PADDING); })
            .attr('width',
                  function(d) { return xScale(d.end - d.start) - xScale(0); })
            .attr('height',
                  function(d) {
                    return yScale(1 - 2 * LINE_PADDING) - yScale(0);
                  })
            .attr('class', function(d) { return d.classes; })
            .append('title').text(function(d) { return d.text; });
    /*
    this.gLines_.selectAll('line')
        .data(this.lines_)
        .enter().append('line')
            .attr('x1', function(d) { return xScale(d.start); })
            .attr('y1', function(d) { return yScale(d.day + LINE_PADDING); })
            .attr('x2', function(d) { return xScale(d.end); })
            .attr('y2', function(d) { return yScale(d.day + LINE_PADDING); })
            .attr('class', function(d) { return 'lineId' + d.id; })
            .attr('stroke-width', yScale(1 - 2 * LINE_PADDING))
            .attr('stroke', function(d) { return d.color; })
            .append('title').text(function(d) { return d.text; });
    */

    var DOT_RADIUS = 200;  // seconds
    var DOT_PADDING = 0;  // days
    this.gDots_.selectAll('rect')
        .data(this.dots_)
        .enter().append('rect')
            .attr('x', function(d) { return xScale(d.location - DOT_RADIUS); })
            .attr('y', function(d) { return yScale(d.day + DOT_PADDING); })
            .attr('width', xScale(2 * DOT_RADIUS) - xScale(0))
            .attr('height', yScale(1 - 2 * DOT_PADDING) - yScale(0))
            .append('title').text(function(d) { return d.text; });
  };

  /*
  var renderData = function(events, config) {
    // Map the events into shapes.
    var shapes = shapesOfEvents(events, config);

    svg.selectAll('line')
        .data(shapes.lines)
        .enter()
            .append('line')
                .attr('x1', function(d) { return xScale(d.day + 0.5); })
                .attr('y1', function(d) { return yScale(d.start); })
                .attr('x2', function(d) { return xScale(d.day + 0.5); })
                .attr('y2', function(d) { return yScale(d.end); })
                .attr('stroke', function(d) { return d.color; })
                .attr('stroke-width', xScale(0.7))
                .append('title')
                    .attr('html', function(d) { return 'hover!'; });

    svg.selectAll('circle')
        .data(shapes.dots)
        .enter()
            .append('circle')
                .attr('cx', function(d) { return xScale(d.day + 0.5); })
                .attr('cy', function(d) { return yScale(d.location); })
                .attr('r', xScale(0.5))
                .attr('fill', 'none')
                .attr('stroke', function(d) { return d.color; })
                .attr('stroke-width', xScale(0.1));

  };
  */

  var newDateParser = function(firstDate) {
    // Note that this implicitly uses the timezone in the browser to
    // determine when days begin and end.
    var beginningOfFirstDate = d3.time.day.floor(firstDate);
    // Return a function that takes a date and returns the days since the
    // first date.
    return function(date) {
      var s = (date - beginningOfFirstDate) / 1000;
      return {
        day: Math.floor(s / SECONDS_PER_DAY),
        location: s % SECONDS_PER_DAY
      };
    };
  };

  /*
  var color = null;

  var shapesOfEvents = function(events, config) {
    var shapes = { 'dots': [], 'lines': [] };

    var isLoggedIn = false;
    var isScreenLocked = false;
    var beginWorkingEvent = null;
    var beginLockedEvent = null;

    for (var i in events) {
      var e = events[i];
      console.log(e);
      switch (e.type) {
        case 'LOGIN':
          assert(!isLoggedIn);
          isLoggedIn = true;
          assert(!beginWorkingEvent);
          beginWorkingEvent = e;
          break;
        case 'SCREEN_UNLOCKED':
          assert(isLoggedIn);
          assert(isScreenLocked);
          assert(!beginWorkingEvent);
          isScreenLocked = false;
          beginWorkingEvent = e;
          assert(beginLockedEvent);
          if (beginLockedEvent.day == e.day) {
            addLine(beginLockedEvent, e, '#ccf', shapes.lines);
          }
          beginLockedEvent = null;
          break;
        case 'LOGOUT':
          assert(isLoggedIn);
          assert(!isScreenLocked);
          assert(beginWorkingEvent);
          isLoggedIn = false;
          addLine(beginWorkingEvent, e, 'steelblue', shapes.lines);
          beginWorkingEvent = null;
          break;
        case 'SCREEN_LOCKED':
          assert(isLoggedIn);
          assert(!isScreenLocked);
          assert(beginWorkingEvent);
          isScreenLocked = true;
          addLine(beginWorkingEvent, e, 'steelblue', shapes.lines);
          beginWorkingEvent = null;
          assert(!beginLockedEvent);
          beginLockedEvent = e;
          break;
        case 'PRODACCESS':
          assert(isLoggedIn);
          assert(!isScreenLocked);
          shapes.dots.push({
            day: e.day,
            location: e.location,
            color: '#555',
            text: (e.type + ' at ' + e.date)
          });
          break;
        default:
          throw 'Unknown event type: ' + e.type + '. Full event: ' + e;
      }
    }

    var now = {
      day: events[events.length - 1].day,
      location: (new Date() - d3.time.day.floor(new Date())) / 1000,
      color: '#c00',
      text: 'Now'
    };

    // Add a dot to represent the present.
    shapes.dots.push(now);

    if (isLoggedIn && !isScreenLocked) {
      assert(beginWorkingEvent);
      // Complete the last line until the present.
      addLine(beginWorkingEvent, now, 'steelblue', shapes.lines);
    }


    // XXX: Why are there extra events here?
    console.log(loginStack);
    while (loginStack.length > 0) {
      console.log(loginStack[loginStack.length - 1]);
      addLine(loginStack.pop(), now, '#ccc', shapes.lines);
    }

    return shapes;
  };

  var addLine = function(e1, e2, color, lines) {
    var shown = false;
    for (var day = e1.day; day <= e2.day; ++day) {
      var line_start = (day == e1.day) ? e1.location : 0;
      var line_end = (day == e2.day) ? e2.location : SECONDS_PER_DAY - 1;
      if (line_end + 1 - line_start == SECONDS_PER_DAY && !shown) {
        shown = true;
        console.log('LONG LINE: ');
        console.log(e1);
        console.log(e2);
      }
      lines.unshift({
        color: color,
        day: day,
        start: line_start,
        end: line_end
      });
    }
  }
  */

})(window);

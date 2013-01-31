(function(window) {
  var SECONDS_PER_DAY = 86400;

  var assert = function(x) {
    if (!x) {
      throw "Assertion failed.";
    }
  };

  var render = window.render = function(config) {
    d3.csv(config.csvFile, function(events) {
      renderData(events, config.shapes);
    });
  };

  var renderData = function(events, shapesConfig) {
    // Parse each of the dates in the events from strings to Date objects.
    for (var i in events) {
      events[i].date = new Date(events[i].date);
    }

    // Sort the events by date.
    events.sort(function(d1, d2) {
      return d1.date - d2.date;
    });

    // Calculate the day/location that the event occurred on, and add it to
    // the event object.
    var dateParser = newDateParser(events[0].date);
    for (i in events) {
      var tmp = dateParser(events[i].date);
      events[i].day = tmp.day;
      events[i].location = tmp.location;
    }
    var dayCount = events[events.length - 1].day + 1;

    // Parse the events into shapes.
    var shapes = shapesOfEvents(events, shapesConfig);

    var width = 1100,
        height = 500;

    var xScale = d3.scale.linear()
                 .domain([0, 365]).range([0, width]),
        yScale = d3.scale.linear()
                 .domain([0, SECONDS_PER_DAY]).range([0, height]);

    // Create SVG element.
    var graph = d3.select('body').append('svg')
        .attr('class', 'graph')
        .attr('width', width)
        .attr('height', height);

    graph.selectAll('line')
        .data(shapes.lines)
        .enter()
            .append('line')
                .attr('x1', function(d) { return xScale(d.day + 0.5); })
                .attr('y1', function(d) { return yScale(d.start); })
                .attr('x2', function(d) { return xScale(d.day + 0.5); })
                .attr('y2', function(d) { return yScale(d.end); })
                .attr('stroke', function(d) { return d.color; })
                .attr('stroke-width', 2);

    graph.selectAll('circle')
        .data(shapes.dots)
        .enter()
            .append('circle')
                .attr('cx', function(d) { return xScale(d.day + 0.5); })
                .attr('cy', function(d) { return yScale(d.location); })
                .attr('r', 2)
                .attr('fill', function(d) { return d.color; });

  };

  var newDateParser = function(firstDate) {
    // Note that this implicitly uses the timezone in the browser to
    // determine when days begin and end.
    var beginningOfFirstDate = new Date(firstDate).setHours(0, 0, 0, 0);
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

  var color = null;

  var shapesOfEvents = function(events, shapesConfig) {
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
      location: (new Date() - (new Date().setHours(0, 0, 0, 0))) / 1000,
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


    /*
    // XXX: Why are there extra events here?
    console.log(loginStack);
    while (loginStack.length > 0) {
      console.log(loginStack[loginStack.length - 1]);
      addLine(loginStack.pop(), now, '#ccc', shapes.lines);
    }
    */

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

})(window);

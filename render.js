
(function(window) {

  var render = window.render = function(config) {
    d3.csv(config.csvFile, function(events) {
      renderData(events, config.shapes);
    });
  };

  var renderData = function(events, shapes) {
    // Parse each of the dates in the events from strings to Date objects.
    for (var i in events) {
      events[i].date = new Date(events[i].date);
    }

    // Add events for day -1 to be one 1 every hour.
    for (var i = 0; i < 23; i++) {
      var d = new Date('January 6, 2013 '+i+':00:00');
      events.push({ type:'FAKE', date: d })

    }

     // Sort the events by date.
    events.sort(function(d1, d2) {
      return d1.date - d2.date;
    });

    // Bin the events into days. 86400 seconds in a day.
    var BIN_SIZE_IN_SEC = 86400;
    var bins = putEventsIntoBins(events, BIN_SIZE_IN_SEC);

    var width = 1100,
        height = 500;

    var xScale = d3.scale.linear()
                 .domain([0, bins.length]).range([0, width]),
        yScale = d3.scale.linear()
                 .domain([0, BIN_SIZE_IN_SEC]).rangeRound([0, height]);

    // Create SVG element.
    var graph = d3.select('body').append('svg')
        .attr('class', 'graph')
        .attr('width', width)
        .attr('height', height);

    var secondsOfDate = function(dateString) {
      var d = new Date(dateString);
      console.log(d.getTime() / 1000 % 86400);
      return (d.getTime() / 1000) % 86400;
    }

    graph.selectAll('rect')
        .data(events)
        .enter()
            .append('rect')
                .attr('class', function(d) { return d.type })
                .attr('x', function(d) { return xScale(d.binIndex); })
                .attr('y', function(d) { return yScale(d.location); })
                .attr('width', xScale(1))
                .attr('height', function(d) { return yScale(800); /* yScale(d.location); */ })

  };

  var putEventsIntoBins = function(events, binLengthInSeconds) {
    // Note that this implicitly uses the timezone in the browser to
    // determine when days begin and end.
    var beginningOfFirstDate = new Date(events[0].date).setHours(0, 0, 0, 0);
    console.log(new Date(beginningOfFirstDate));
    var secondsSinceFirstDate = function(date) {
      return Math.round((date - beginningOfFirstDate) / 1000);
    };
    var getBinIndex = function(date) {
      return Math.floor(secondsSinceFirstDate(date) / binLengthInSeconds);
    };

    var bins = [],
        eventIx = 0,
        binCount = getBinIndex(events[events.length - 1].date) + 1;
    for (var i = 0; i < binCount; ++i) {
      var bin = [];
      while (eventIx < events.length &&
             getBinIndex(events[eventIx].date) == i) {
        var curEvent = events[eventIx++];
        curEvent.location =
            secondsSinceFirstDate(curEvent.date) % binLengthInSeconds;
        curEvent.binIndex = i;
        bin.push(curEvent);
      }
      bins.push(bin);
    }
    return bins;
  };

})(window);

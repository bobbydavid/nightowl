
(function(exports, windowWidth, windowHeight) {
  var generateData = function() {
    var data = [];
    var orig = [4, 65, 23, 80, 71, 22, 43, 10, 54, 85, 56, 17];
    var t = Date.now();
    for (var i in orig) {
      data.push({ time: t, value: orig[i] });
      t += 1;
    }
    return data;
  };

  var render = exports.render = function(config) {
    d3.csv(config.csvFile, function(data) {
      renderData(data);
    });
  };

  var renderData = function(data) {
    var width = 1100,
        height = 500;

    // 86400 seconds in one day.
    var xScale = d3.scale.linear().domain([0, data.length]).range([0, width]),
        yScale = d3.scale.linear().domain([0, 86400]).rangeRound([0, height]);

    var graph = d3.select('body').append('svg')
        .attr('class', 'graph')
        .attr('width', width * data.length - 1)
        .attr('height', height)

    graph.selectAll('rect')
        .data(data)
        .enter().append('rect')
            .attr('x', function(d, i) { return xScale(i) - 0.5; })
            .attr('y', function(d) { return height - yScale(d.value) - 0.5; })
            .attr('width', width)
            .attr('height', function(d) { return yScale(d.value); });

  };

})(window, window.innerWidth, window.innerHeight);

(function(){
  'use strict';

  angular
    .module('graffeDrctv', [])
    .directive('graffe', graffe);

  graffe.$inject = [];

  function graffe() {
    var directive = {
      link: link,
      restrict: 'E',
      scope: {
        data: '=graph'
      }
    };
    return directive;

    function link(scope, el, attrs) {
        el = el[0];
        var width;
        var height;
        var svg = d3.select(el).append("svg");
        var fill = d3.scale.category10();
        var nodes = d3.range(100).map(function(i) {
          return {index: i};
        });
        var force = d3.layout.force();

        scope.$watch(function(){
          width = el.clientWidth;
          height = el.clientHeight;
          return width;
        }, resize);

        function resize() {
          svg.attr({width: width, height: height - 5});
          force.nodes(nodes).size([width, height])
               .on("tick", tick)
               .start();
        }

        var node = svg.selectAll(".node")
                      .data(nodes)
                      .enter().append("circle")
                      .attr("class", "node")
                      .attr("cx", function(d) { return d.x; })
                      .attr("cy", function(d) { return d.y; })
                      .attr("r", 8)
                      .style("fill", function(d, i) { return fill(i & 3); })
                      .style("stroke", function(d, i) { return d3.rgb(fill(i & 3)).darker(2); })
                      .call(force.drag)
                      .on("mousedown", function() { d3.event.stopPropagation(); });

        svg.style("opacity", 1e-6)
           .transition()
           .duration(1000)
           .style("opacity", 1);

        d3.select("body")
          .on("mousedown", mousedown);

        function tick(e) {

          // Push different nodes in different directions for clustering.
          var k = 6 * e.alpha;
          nodes.forEach(function(o, i) {
            o.y += i & 1 ? k : -k;
            o.x += i & 2 ? k : -k;
          });

          node.attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; });
        }

        function mousedown() {
          nodes.forEach(function(o, i) {
            o.x += (Math.random() - .5) * 40;
            o.y += (Math.random() - .5) * 40;
          });
          force.resume();
        }
    }
  }
})();

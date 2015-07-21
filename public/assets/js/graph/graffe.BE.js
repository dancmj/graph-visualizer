var _ = require('lodash');
var binaryHeap = require('../utils/binaryHeap.js');

module.exports = function() {
  function Vertex(name) {
    this.name = name;
    this.adjacents = [];
    this.distanceFromRoot = 0;
    this.maxFlow = null;
    this.minFlow = 0;
    this.color = -1; // -1 -> unexplored ; path -> treePath ; black -> explored ; gray -> on queue ;
    this.tag = {
      key: Infinity,
      parent: null,
      edge: null
    };
  };

  function Edge(source, sink, properties) {
    properties = properties || {};
    _.forEach(properties, function(val, key) {
      if (typeof val !== 'number') properties[key] = 0;
    })
    this.source = source;
    this.sink = sink;
    this.cost = properties.cost || 0;
    this.minFlow = !properties.minFlow || properties.minFlow < 0 ? 0 : properties.minFlow;
    this.maxFlow = !properties.maxFlow ? Infinity : properties.maxFlow < this.minFlow ? this.minFlow : properties.maxFlow;
    this.flow = !properties.flow || properties.flow < 0 ? 0 : properties.flow > this.maxFlow ? this.maxFlow : properties.flow;
    this.redge = null;
    this.fake = false;
    this.color = -1;
  };

  function Graph() {
    this.vertices = [];
    this.edges = [];
    this.directed = true;
    this.adjacencyMatrix = [];
  };

  Graph.prototype = {
    FindVertex: function(name) {
      return _.find(this.vertices, {
        'name': name
      }) || false;
    },
    AddVertex: function(name) {
      if (!name) return false;
      name = _.trunc(_.trim(name), {
        length: 10,
        omission: ''
      });
      var repeatedVertex = this.FindVertex(name);
      if (repeatedVertex) return repeatedVertex;

      this.vertices.push(new Vertex(name));
      return _.last(this.vertices);
    },
    RemoveVertex: function(name) {
      var eraseeVertex = this.FindVertex(name),
        self = this;
      if (!eraseeVertex) return false;

      _.forEachRight(eraseeVertex.adjacents, function(edge) {
        !edge.fake ? self.RemoveEdge(eraseeVertex.name, edge.sink.name) : self.RemoveEdge(edge.sink.name, eraseeVertex.name);
      });

      this.vertices.splice(_.findIndex(this.vertices, function(vertex) {
        return vertex.name === name;
      }), 1);

      return true;
    },
    FindEdge: function(source, sink) {
      return _.find(this.edges, function(edge) {
        return edge.sink.name == sink && edge.source.name == source;
      }) || false;
    },
    AddEdge: function(source, sink, properties) {
      if (!source || !sink || source == sink) {
        return false;
      }

      if (!properties) {
        properties = {
          cost: 0,
          flow: 0,
          maxFlow: null,
          minFlow: 0
        }
      }

      source = this.AddVertex(source);
      sink = this.AddVertex(sink);

      var repeatedEdge = this.FindEdge(source.name, sink.name);
      if (repeatedEdge) return repeatedEdge;

      var edge = new Edge(source, sink, properties);
      var redge = new Edge(sink, source, {
        cost: Infinity,
        flow: 0,
        maxFlow: 0,
        minFlow: properties.minFlow
      });
      redge.fake = true;
      edge.redge = redge;
      redge.redge = edge;
      source.adjacents.push(edge);
      sink.adjacents.push(redge);
      this.edges.push(edge);

      return _.last(this.edges);
    },
    RemoveEdge: function(source, sink) {
      source = this.FindVertex(source);
      sink = this.FindVertex(sink);

      if (!this.edges.length || !source || !sink || sink.name == source.name || !this.FindEdge(source.name, sink.name)) {
        return false;
      }

      source.adjacents.splice(_.findIndex(source.adjacents, function(edge) {
        if (!edge.fake && edge.sink.name == sink.name) edge.redge = null;
        return !!edge.redge;
      }), 1);

      sink.adjacents.splice(_.findIndex(sink.adjacents, function(edge) {
        if (edge.fake && edge.source.name == sink.name) edge.redge = null;
        return !!edge.redge;
      }), 1);

      this.edges.splice(_.findIndex(this.edges, function(edge) {
        return edge.source.name == source.name && edge.sink.name == sink.name;
      }), 1);

      return true;
    },
    //////////////////////////////////////
    IsBipartite: function() {
      if (!this.vertices.length || !this.edges.length) return true;

      var startVertex = this.vertices[0];
      startVertex.color = 1;

      var queue = [],
        result = true;

      queue.push(startVertex);
      while (queue.length > 0 && result) {
        var v = queue.shift();
        _.forEach(v.adjacents, function(edge){
            if(edge.sink.color == -1){
                edge.sink.color = 1 - v.color;
                queue.push(edge.sink);
            }else if(edge.sink.color == v.color){
                result = false;
            }
        });
      }

      return result;
    },
    BFS: function(startVertex){
      startVertex = this.FindVertex(startVertex);
      if(!startVertex) return false;

      startVertex.color = 'gray';

      var queue = [], self = this;
      queue.push(startVertex);

      while(queue.length > 0){
        var v = queue.shift();

        _.forEach(v.adjacents, function(edge){
          if(edge.sink.color == -1 && !(edge.fake && self.directed)){
            edge.color = 'path';
            edge.redge.color = 'path';
            edge.sink.distanceFromRoot = v.distanceFromRoot + 1;
            edge.sink.color = 'gray';
            queue.push(edge.sink);
          }
        });
        v.color = 'black';
      };

      return true;
    },
    DFS: function(currentVertex){
      currentVertex = this.FindVertex(currentVertex), self = this;
      if(!currentVertex) return false;

      currentVertex.color = 'black';
      _.forEach(currentVertex.adjacents, function(edge){
        if(edge.sink.color == -1 && !(edge.fake && self.directed)){
          edge.color = 'path';
          edge.redge.color = 'path';
          edge.sink.distanceFromRoot = currentVertex.distanceFromRoot + 1;
          self.DFS(edge.sink.name);
        }
      });

      return true;
    },
    PRIM: function(startVertex){
      startVertex = this.FindVertex(startVertex);
      if(!startVertex) return false;

      startVertex.tag.key = 0;

      var heap = binaryHeap.create(function(vertex){return vertex.tag.key}), self = this;
      heap.push(startVertex);

      while(heap.content.length > 0){
        v = heap.pop();
        v.color = 'black';

        _.forEach(v.adjacents, function(edge){
          if(edge.sink.color == -1 && !(edge.fake && self.directed)){
            if(edge.fake) edge.cost = edge.redge.cost;
            if(edge.sink.color != 'black' && edge.cost < edge.sink.tag.key){
              edge.sink.tag = {key: edge.cost, parent: v, edge: edge};
              heap.push(edge.sink);
            }
          }
        });
      }

      _.forEach(self.vertices, function(vertex){
        if(vertex.tag.edge != null){
          vertex.tag.edge.color = vertex.tag.edge.redge.color = 'path';
        }
      });

      return true;
    }
    //////////////////////////////////////
  }

  function newGraph() {
    return new Graph();
  }

  return {
    newGraph: newGraph
  }
}

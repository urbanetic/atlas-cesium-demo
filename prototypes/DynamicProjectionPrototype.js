define([
  'atlas/lib/utility/Class',
  'atlas/material/Color'
], function(Class, Color) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      setTimeout(this.runProjection.bind(this), 1000);
    },

    runProjection: function() {
      var atlas = this.atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var timeSteps = 20;

      var data = [];
      var ids = [];
      var stepValues;
      var stepArgs;
      for (var i = 0; i < timeSteps; i++) {
        // Generate dummy values for projection.
        stepValues = {};
        stepArgs = {index: i, values: stepValues};
        data.push(stepArgs);
        features.forEach(function(feature, j) {
          var id = feature.getId();
          ids.push(id);
          stepValues[id] = i + j;
          feature.setHeight(0);
        });
      }

      // var opacity = 0.6;
      // var red = Color.RED.clone();
      // red.alpha = opacity;
      // var green = Color.GREEN.clone();
      // green.alpha = opacity;

      var args = {
        type: 'color',
        ids: ids,
        data: data,
        config: {
          title: 'Color Projection',
          opacity: 0.6,
          // codomain: {
          //   startProj: red,
          //   endProj: green
          // }
        }
      };
      atlas.publish('projection/dynamic/add', args);
      atlas.publish('projection/render', {id: args.projection.getId()});

      var args2 = {
        type: 'height',
        ids: ids,
        data: data,
        config: {
          title: 'Height Projection',
          codomain: {
            startProj: 5,
            endProj: 300
          }
        }
      };
      atlas.publish('projection/dynamic/add', args2);
      atlas.publish('projection/render', {id: args2.projection.getId()});
    }

  });
});

define([
  'atlas/lib/utility/Class',
  'atlas/material/Color'
], function(Class, Color) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      setTimeout(this.runProjection.bind(this), 4000);
    },

    runProjection: function() {
      var atlas = this.atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      // Generate dummy values for projection.
      var values = {};
      features.forEach(function(feature, i) {
        var id = feature.getId();
        values[id] = i;
        feature.setHeight(0);
      });

      // var opacity = 0.6;
      // var red = Color.RED.clone();
      // red.alpha = opacity;
      // var green = Color.GREEN.clone();
      // green.alpha = opacity;

      var args = {
        type: 'color',
        ids: Object.keys(values),
        config: {
          title: 'Color Projection',
          values: values,
          opacity: 0.6,
          // codomain: {
          //   startProj: red,
          //   endProj: green
          // }
        }
      };
      atlas.publish('projection/add', args);
      atlas.publish('projection/render', {id: args.projection.getId()});

      var args2 = {
        type: 'height',
        ids: Object.keys(values),
        config: {
          title: 'Height Projection',
          values: values,
          codomain: {
            startProj: 5,
            endProj: 300
          }
        }
      };
      atlas.publish('projection/add', args2);
      atlas.publish('projection/render', {id: args2.projection.getId()});
    }

  });
});

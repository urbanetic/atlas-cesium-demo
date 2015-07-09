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
      // Generate dummy values for projection.
      var values = {};
      features.forEach(function(feature, i) {
        // NOTE: Should not get different results whether using features or their forms.
        var id = feature.getId();
        // NOTE: 20 is a drift to ensure values are projected correctly.
        values[id] = i + 20;
      });
      features[0].setSelected(true);

      var args = {
        type: 'color',
        ids: Object.keys(values),
        config: {
          title: 'Color Projection',
          type: 'discrete',
          values: values,
          bins: [
            {label: 'Orange'},
            {label: 'Green'},
            {label: 'Purple'}
          ],
          codomain: [
            {fixedProj: 'orange'},
            {fixedProj: null},
            {fixedProj: 'purple'}
          ]
        }
      };
      // var args = {
      //   type: 'color',
      //   ids: Object.keys(values),
      //   config: {
      //     title: 'Color Projection',
      //     type: 'continuous',
      //     values: values,
      //   }
      // };
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

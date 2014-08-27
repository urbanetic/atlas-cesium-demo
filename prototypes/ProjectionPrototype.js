define([
  'atlas/lib/utility/Class',
  'atlas/model/Colour'
], function(Class, Colour) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      setTimeout(this.runProjection.bind(this), 4000);
    },

    runProjection: function () {
      var atlas = this.atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      // Generate dummy values for projection.
      var values = {};
      features.forEach(function(feature, i) {
        var id = feature.getId();
        values[id] = i;
      });
      var args = {
        type: 'colour',
        ids: Object.keys(values),
        config: {
          title: 'Sample Projection',
          values: values,
          codomain: {startProj: Colour.RED, endProj: Colour.GREEN}
        }
      };
      atlas.publish('projection/add', args);
      atlas.publish('projection/render', {id: args.projection.getId()});
    }

  });
});

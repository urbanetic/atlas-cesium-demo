define([
  'atlas/lib/utility/Class',
], function(Class) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var ids = features.map(function(feature) {
        return feature.getId();
      });
      atlas.publish('entity/select', {
        ids: ids
      });

      atlas.subscribe('entity/selection/change', function () {
        console.log('entity/selection/change', arguments);
      });

      atlas.subscribe('entity/select', function () {
        console.log('entity/select', arguments);
      });
    }

  });
});

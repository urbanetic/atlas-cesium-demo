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
        ids: ids,
        // triggerEvents: false
      });

      atlas.subscribe('entity/selection/change', function() {
        console.log('entity/selection/change', arguments);
      });

      atlas.subscribe('entity/select', function() {
        console.log('entity/select', arguments);
      });

      atlas.subscribe('entity/deselect', function() {
        console.log('entity/deselect', arguments);
      });

      var featureA = features[0];
      featureA.setSelected(false);
      setTimeout(function() {
        featureA.setSelected(true);
        setTimeout(function() {
          // This should trigger deselect event.
          featureA.remove();
        }, 4000);
      }, 4000);

      // Re-rendering a feature should keep the existing selection style.
      var featureB = features[0];
      featureB.setSelected(true);
      setTimeout(function() {
        featureB.setHeight(featureB.getHeight() + 10);
      }, 4000);

    }

  });
});

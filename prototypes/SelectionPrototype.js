define([
  'atlas/lib/utility/Class',
  'atlas/material/Color',
  'atlas/model/GeoPoint',
  'underscore'
], function(Class, Color, GeoPoint, _) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      entityManager.setHighlightOnHover(true);
      var features = entityManager.getFeatures();
      var ids = features.map(function(feature) {
        return feature.getId();
      });
      atlas.publish('entity/select', {
        ids: ids.slice(0, 3)
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

      // Selecting a polygon should keep the same opacity.
      var featureC = features[4];
      var newColor = new Color(0, 1, 0, 0.2);
      featureC.modifyStyle({fillMaterial: newColor});
      setTimeout(function() {
        // _.times(6, function(i) {
        //   setTimeout(function() {
        //     featureC.setSelected(true);
        //     featureC.setSelected(false);
        //     featureC.translate(new GeoPoint(0.0001, 0.0001));
        //   }, i * 1000);
        // });
      }, 5000);
    }

  });
});

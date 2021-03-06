define([
  'atlas/lib/utility/Class',
  'atlas/material/Color',
  'atlas/material/Style',
  'atlas/model/GeoEntity',
  'jquery'
], function(Class, Color, Style, GeoEntity, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var feature = features[0];

      atlas.subscribe('entity/select', function() {
        console.log('select', arguments);
      });

      atlas.subscribe('entity/deselect', function() {
        console.log('deselect', arguments);
      });

    }

  });
});

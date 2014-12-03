define([
  'atlas/lib/utility/Class',
  'atlas/model/GeoPoint'
], function(Class, GeoPoint) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var feature = features[0];

      var translation = new GeoPoint({latitude: 0.0005, longitude: 0.0005});

      setInterval(function() {
        feature.translate(translation);
      }, 1000);
    }

  });
});

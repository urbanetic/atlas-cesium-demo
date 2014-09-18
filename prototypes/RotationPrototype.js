define([
  'atlas/lib/utility/Class',
  'atlas/model/GeoPoint',
  'atlas/model/Vertex'
], function(Class, GeoPoint, Vertex) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
//      atlas.publish('sleepMode', false);
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
//      var feature = features[0];
      features.forEach(function(feature) {
        feature.translate(new GeoPoint(0.003, 0.003));
        feature.setRotation(new Vertex(0, 0, 90));
        feature.setScale(new Vertex(1.5, 1.5, 4));
        setTimeout(function () {
          feature.setDisplayMode('footprint');
        }, 5000);
        setTimeout(function () {
          feature.setDisplayMode('extrusion');
        }, 8000);
      });
//      setInterval(function() {
//        feature.rotate(new Vertex(0, 0, 90));
//      }, 1000);
    }

  });
});

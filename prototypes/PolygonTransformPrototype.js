define([
  'atlas/lib/utility/Class',
  'atlas/model/GeoPoint',
  'atlas/model/Vertex',
  'atlas-cesium/model/Polygon'
], function(Class, GeoPoint, Vertex, Polygon) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var feature = features[0];

      var vertices = 'POLYGON((-37.826663862716686 145.23757963332037,-37.826663862716686 145.23765763332037,-37.82669286271668 145.23765763332037,-37.82669286271668 145.23771763332036,-37.826751862716684 145.23771763332036,-37.826751862716684 145.23771163332034,-37.826857862716686 145.23771163332034,-37.826857862716686 145.23766263332035,-37.82688786271669 145.23766263332035,-37.82688786271669 145.23760363332036,-37.826719862716686 145.23760363332036,-37.826720862716684 145.23757963332037,-37.826663862716686 145.23757963332037))';

      var polygon = new Polygon('poly123', {
          vertices: vertices,
          show: true
        }, feature._bindDependencies({show: true}));

      // setTimeout(function () {
      //   console.log('centroid', polygon.getCentroid());
      //   polygon.setCentroid(polygon.getCentroid());
      // }, 3000);

      // Translate it far away to check if the rotation is still fixed to the old global surface
      // normal rather than the new one.
      var newCentroid = new GeoPoint([115.8602151, -31.9441179, 0.0]);
      polygon.setCentroid(newCentroid);
      atlas.publish('camera/zoomTo', {position: newCentroid});

      // Ensure subsequent translations use matrix transformations if they are sufficiently small.
      setTimeout(function() {
        setInterval(function() {
          polygon.translate(new GeoPoint(0.0001, 0.0001));
        }, 2000);
      }, 3000);

      atlas.publish('camera/zoomTo', {
        // position: feature.getCentroid()
        position: polygon.getCentroid()
      });
    }

  });
});
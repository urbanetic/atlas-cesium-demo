define([
  'atlas/assets/testMesh',
  'atlas/assets/testWKT',
  'atlas/lib/utility/Class',
  'atlas/material/Color',
  'atlas/model/GeoEntity',
  'atlas/model/Feature',
  'atlas/model/GeoPoint',
  'atlas/material/Style',
  'atlas-cesium/model/Handle',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
  'atlas-cesium/cesium/Source/Core/Ellipsoid',
  'jquery'
], function(testMesh, testWKT, Class, Color, GeoEntity, Feature, GeoPoint, Style, Handle,
  Cartesian3, Ellipsoid, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var someFeature = features[0];
      // var targetPosition = someFeature.getCentroid();
      var targetPosition = new GeoPoint(115.852662, -31.9546781);

      $.getJSON('assets/VIC_SH_2St_3Bed_roof.c3ml.json', function(c3ml) {
        console.log('c3ml', c3ml);
        atlas.publish('entity/show/bulk', {features: [c3ml]});
        var feature = entityManager.getById(c3ml.id);
        // feature.setForm(Feature.DisplayMode.MESH, meshFeature);
        var mesh = feature.getForm(Feature.DisplayMode.MESH);

        mesh.setCentroid(targetPosition);

        cesiumAtlas.publish('camera/zoomTo', {
          position: targetPosition
        });

      });

    }

  });
});

define([
  'atlas/assets/testMesh',
  'atlas/assets/testWKT',
  'atlas/lib/utility/Class',
  'atlas/model/Colour',
  'atlas/model/GeoEntity',
  'atlas/model/Feature',
  'atlas/model/GeoPoint',
  'atlas/model/Style',
  'atlas-cesium/model/Handle',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
  'atlas-cesium/cesium/Source/Core/Ellipsoid',
  'jquery'
], function(testMesh, testWKT, Class, Colour, GeoEntity, Feature, GeoPoint, Style, Handle,
  Cartesian3, Ellipsoid, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var someFeature = features[0];
      var targetPosition = someFeature.getCentroid().translate(new GeoPoint(0.001, 0.001));

      cesiumAtlas.publish('camera/zoomTo', {
        position: targetPosition
      });

      var polyArgs = {
        id: 'poly123',
        show: false
      };
      polyArgs.polygon = {
        vertices: testWKT[0],
        elevation: 0,
        height: 20
      };
      cesiumAtlas.publish('entity/show', polyArgs);
      var feature = entityManager.getById('poly123');
      var polygon = feature.getForm();
      console.log('feature', feature);

      // feature.show();

      polygon.setCentroid(targetPosition);
      console.log(targetPosition, polygon.getCentroid());

      atlas.publish('entity/show/bulk', {features: [testMesh]});
      var meshFeature = entityManager.getById(testMesh.id);
      feature.setForm(Feature.DisplayMode.MESH, meshFeature);
      Object.keys(Feature.DisplayMode).forEach(function(modeId) {
        var form = feature.getForm(Feature.DisplayMode[modeId]);
        // form && form.setCentroid(targetPosition);
      });

      feature.show();

      // setTimeout(function() {
      //   feature.setCentroid(targetPosition);
      //   feature
      //   // feature.show();
      // }, 1000);

      return;

      testMesh.show = false      

      atlas.publish('entity/show/bulk', {features: [testMesh]});

      var id = testMesh.id;
      var feature = entityManager.getById(id);
      var centroid = feature.getCentroid();
      console.debug('meshFeature', feature);
      console.debug('mesh', feature._mesh);
      console.debug('centroid', centroid);
      atlas.publish('camera/zoomTo', {position: centroid});

      setTimeout(function() {
        feature.translate(new GeoPoint(0, 0, 10));
        console.log('tick');
        console.debug('centroid', feature.getCentroid());
      }, 4000);


//      atlas.publish('entity/show', {
//        id: 123,
//        mesh: testMesh
//      });

//      $.getJSON('assets/VIC_SH_2St_3Bed_roof.c3ml.json', function(c3ml) {
//        console.log('c3ml', c3ml);
//        c3ml.geoLocation = [145.253159238, -37.81175024725, 0];
//        atlas.publish('entity/show/bulk', {features: [c3ml]});
//
//        var id = c3ml.id;
//        var meshFeature = entityManager.getById(id);
//
//        meshFeature.translate(new GeoPoint({latitude: 0.001, longitude: 0.001}));
//
//        var mesh = meshFeature.getForm();
//        var positions = mesh._getFootprintVertices();
//        console.log('positions', positions);
//        var centroid = mesh.getCentroid();
//        console.log('centroid', centroid);
//
//        atlas.publish('entity/show', {
//          id: 'mesh-footprint',
//          polygon: {
//            vertices: positions,
//            style: new Style({borderColour: new Colour('yellow')}),
//            width: '1px'
//          }
//        });
//
//        var centroidHandle = new Handle(meshFeature._bindDependencies({target: centroid, owner: meshFeature}));
//        centroidHandle.show();
//
//        atlas.publish('camera/zoomTo', {position: centroid});
//
//        setTimeout(function() {
////          mesh.setElevation(10);
//          mesh.translate(new GeoPoint(0, 0, 10));
//          mesh.show();
//        }, 4000);

//      });
    }

  });
});

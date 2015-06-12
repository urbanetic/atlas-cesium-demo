define([
  'atlas/assets/testMesh',
  'atlas/model/GeoPoint',
  // Code under test
  'atlas-cesium/model/Mesh',
  'atlas-cesium/test/util/AtlasCesiumTestFactory'
], function(testMesh, GeoPoint, Mesh, AtlasCesiumTestFactory) {
  describe('A Mesh', function() {

    var mesh, centroid, constructArgs;

    beforeEach(function() {
      centroid = new GeoPoint({longitude: 144.5, latitude: -37.8999, elevation: 0});
      var cesiumAtlas = AtlasCesiumTestFactory.createAtlasCesium();
      var managers = cesiumAtlas._managers;
      constructArgs = {
        renderManager: managers.render,
        eventManager: managers.event
      };
      mesh = new Mesh('a', testMesh, constructArgs);
    });

    afterEach(function() {
      mesh = null;
    });

//    it('can be constructed into a footprint polygon', function() {
//      var geometry = mesh.getOpenLayersGeometry();
//      console.log('geometry', geometry);
//    });

    it('has a centroid', function() {
      expect(mesh.getCentroid().isCloseTo(centroid, 3)).toBe(true);
    });

    it('can be translated', function() {
      var oldCentroid = mesh.getCentroid();
      var value = new GeoPoint({latitude: 0.001, longitude: 0.001});
      mesh.translate(value);
      expect(mesh.getCentroid().isCloseTo(oldCentroid.translate(value))).toBe(true);
    });

  });
});

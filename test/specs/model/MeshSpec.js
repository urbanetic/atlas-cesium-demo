define([
  'atlas/assets/testMesh',
  // Code under test
  'atlas-cesium/model/Mesh',
  'atlas-cesium/core/CesiumAtlas',
  'atlas-cesium/render/RenderManager',
  'atlas/model/GeoPoint'
], function(testMesh, Mesh, CesiumAtlas, RenderManager, GeoPoint) {
  describe('A Mesh', function() {

    var mesh, centroid, constructArgs;

    beforeEach(function() {
      centroid = new GeoPoint({longitude: 144.5, latitude: -37.8999, elevation: 0});
      // TODO(aramk) Abstract this for use in other tests which need to full Atlas-Cesium
      // environment set up.
      var cesiumAtlas = new CesiumAtlas();
      cesiumAtlas.attachTo(document.createElement('div'));
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

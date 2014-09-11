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
      centroid = new GeoPoint({longitude: 142.10000000000002, latitude: 35.5, elevation: 0});
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

    it('has a centroid', function() {
      expect(mesh.getCentroid()).toEqual(centroid);
    });

  });
});

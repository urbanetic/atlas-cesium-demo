define([
  'atlas/assets/testMesh',
  // Code under test
  'atlas-cesium/model/Mesh',
  'atlas-cesium/core/CesiumAtlas',
  'atlas-cesium/render/RenderManager',
  'atlas/model/GeoPoint'
], function(testMesh, Mesh, CesiumAtlas, RenderManager, GeoPoint) {
  describe('A Mesh', function() {

    var mesh, centroid, area, constructArgs;

    beforeEach(function() {
      // TODO(aramk) This isn't the actual centroid.
      centroid =
          new GeoPoint({longitude: -37.82674343831081, latitude: 145.23760111918708, elevation: 0});
      area = 177.754;

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

//    it('can be constructed', function() {
//      // TODO(aramk)
//    });
//
//    it('has a location', function() {
//      expect(mesh.getGeoLocation()).toEqual(new GeoPoint(testMesh.geoLocation));
//    });

    it('has a centroid', function() {
      var actualCentroid = mesh.getCentroid();
      console.log('actualCentroid', actualCentroid);
      expect(actualCentroid).toEqual(centroid);
    });

  });
});

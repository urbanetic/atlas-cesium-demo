define([
  'atlas/model/GeoPoint',
  // Code under test.
  'atlas-cesium/camera/Camera',
  'atlas-cesium/test/util/AtlasCesiumTestFactory',
], function(GeoPoint, Camera, AtlasCesiumTestFactory) {
  describe ('A Camera', function() {
    var camera,
        aPosition = new GeoPoint({latitude: -37, longitude: 144, elevation: 2000}),
        anOrientation = {tilt: 10, heading: 20, rotation: 30};

    beforeEach(function() {
    });

    afterEach(function() {
      camera = null;
    });

    it ('can be constructed', function() {
      var args = {
        position: aPosition,
        orientation: anOrientation,
        renderManager: AtlasCesiumTestFactory.createManager('render')
      };
      // TODO(aramk) Cesium Camera doesn't use the same metrics as Atlas and doesn't initialize
      // correctly at startup. Might need to wait while.
      camera = new Camera(args);
      expect(camera).not.toBeNull();
      expect(camera.getPosition()).toDeepEqual(aPosition);
      expect(camera.getOrientation()).toDeepEqual(anOrientation);
    });

    it ('can move the camera to new position', function() {
    });
  });
});

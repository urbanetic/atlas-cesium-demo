define([
  // Code under test.
  'atlas-cesium/camera/Camera'
], function(Camera) {
  describe ('A Camera', function() {
    var camera,
        aPosition = { lat: -37, lng: 144, elevation: 2000 },
        anOrientation = { tilt: 10, heading: 20, rotation: 30 };

    beforeEach(function() {
    });

    afterEach(function() {
      camera = null;
    });

    it ('can be constructed', function() {
      var args = {
        position: aPosition,
        orientation: anOrientation,
        renderManager: {}
      };
      camera = new Camera(args);
      expect(camera).not.toBeNull();
      expect(camera._position).toEqual(aPosition);
      expect(camera._orientation).toEqual(anOrientation);
    });

    it ('can move the camera to new position', function() {
    });
  });
});

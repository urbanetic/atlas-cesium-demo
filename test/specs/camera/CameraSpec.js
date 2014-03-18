define([
  // Code under test.
  'atlas-cesium/camera/Camera'
], function (Camera) {
  describe ('A Camera', function () {
    var camera,
        aPosition = { lat: -37, lng: 144, elevation: 2000 },
        anOrientation = { tilt: 10, heading: 20, rotation: 30 };

    beforeEach(function () {
      camera = new Camera();
    });

    afterEach(function () {
      camera = null;
    });

    it ('can move the camera to new position', function () {
    });
  });
});

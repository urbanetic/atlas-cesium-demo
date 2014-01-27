define([
  'atlas/util/DeveloperError',
  'atlas/model/Vertex',
  // Cesium imports
  'atlas-cesium/cesium/Source/Core/Cartographic',
  'atlas-cesium/cesium/Source/Scene/CameraFlightPath',
  // Base class.
  'atlas/camera/Camera'
], function (
  DeveloperError,
  Vertex,
  Cartographic,
  CameraFlightPath,
  CameraCore) {

  //var Camera = function (renderManager, position, orientation) {
  /**
   *
   * @class atlas-cesium.camera.Camera
   */
  return CameraCore.extend( /** @lends atlas-cesium.camera.Camera# */ {

    _init: function (renderManager, position, orientation) {
      this._super(position, orientation);
      this._renderManager = renderManager;
    },

    _animateCamera: function (newCamera) {
      // TODO(bpstudds): Allow for a non-default orientation.
      console.debug('animating camera change');
      var latitude = newCamera.position.x * Math.PI / 180,
          longitude = newCamera.position.y * Math.PI / 180,
          altitude = newCamera.position.z,
          target = new Cartographic(longitude, latitude, altitude),
          flight = {};
      flight = CameraFlightPath.createAnimationCartographic(
        this._renderManager._widget.scene, {
          destination: target,
          duration: newCamera.duration
        }
      );
      this._position = new Vertex(latitude, longitude, altitude);
      this._renderManager._widget.scene.getAnimations().add(flight);
    }
  });
});

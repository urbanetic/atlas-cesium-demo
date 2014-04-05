define([
  'atlas/util/AtlasMath',
  'atlas/util/DeveloperError',
  'atlas/model/Vertex',
  // Cesium imports
  'atlas-cesium/cesium/Source/Core/Cartographic',
  'atlas-cesium/cesium/Source/Scene/CameraFlightPath',
  // Base class.
  'atlas/camera/Camera',
  'atlas/lib/utility/Log'
], function(AtlasMath, DeveloperError, Vertex, Cartographic, CameraFlightPath, CameraCore, Log) {
  /**
   * @classdesc The Camera object controls the position and orientation of the camera.
   * It exposes an API to set position and orientation, zoom to a given GeoEntity
   * or a bookmarked location, and to manual move the Camera.
   * @author Brendan Studds
   *
   * @param {atlas.render.RenderManager} [args.renderManager] - The Atlas render manager instance.
   *
   * @class atlas-cesium.camera.Camera
   * @extends atlas.camera.Camera
   */
  return CameraCore.extend(/** @lends atlas-cesium.camera.Camera# */ {

    _init: function(args) {
      if (!args.renderManager) {
        throw new DeveloperError('Can not create Atlas-Cesium Camera without render manager.');
      }
      this._super(args);
      this._renderManager = args.renderManager;
    },

    // -------------------------------------------
    // GETTERS AND SETTERS
    // -------------------------------------------

    /**
     * @returns {atlas.model.GeoPoint} The current position of the Camera.
     */
    getPosition: function() {
      // TODO(aramk) This is accessing the global camera, not the current camera.
      var cesiumCamera = this._renderManager.getCesiumCamera(),
          cartesian = cesiumCamera.position;
      return this._renderManager.cartographicFromCartesian(cartesian);
    },

    /**
     * @returns {{bearing: Number, rotation: Number, tilt: Number}} The current orientation of the
     * Camera.
     */
    getOrientation: function() {
      // TODO(aramk) This is accessing the global camera, not the current camera.
      var controller = this._renderManager.getCameraController(),
          bearing = AtlasMath.toDegrees(controller.heading),
          tilt = AtlasMath.toDegrees(controller.tilt);
      // TODO(aramk) Rotation not handled.
      return {bearing: bearing, rotation: 0, tilt: tilt};
    },

    // -------------------------------------------
    // BEHAVIOUR
    // -------------------------------------------

    _animateCamera: function(newCamera) {
      // TODO(bpstudds): Allow for a non-default orientation.
      var latitude = AtlasMath.toRadians(newCamera.position.lat),
          longitude = AtlasMath.toRadians(newCamera.position.lng),
          altitude = newCamera.position.elevation,
          position = new Cartographic(longitude, latitude, altitude);
      var flight = CameraFlightPath.createAnimationCartographic(
          this._renderManager._widget.scene, {
            destination: position,
            duration: newCamera.duration
          }
      );
      this._renderManager.getAnimations().add(flight);
      Log.debug('animating camera change', newCamera);
      Log.debug('position', this.getPosition());
      Log.debug('orientation', this.getOrientation());
      this._position = newCamera.position;
      this._orientation = newCamera.orientation;
    }
  });
});

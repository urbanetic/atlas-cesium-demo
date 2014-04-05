define([
  'atlas/util/AtlasMath',
  'atlas/util/DeveloperError',
  'atlas/model/Vertex',
  // Cesium imports
  'atlas-cesium/cesium/Source/Core/Cartographic',
  'atlas-cesium/cesium/Source/Scene/CameraFlightPath',
  // Base class.
  'atlas/camera/Camera',
  'atlas/util/mixin',
  'atlas/lib/utility/Log'
], function(AtlasMath, DeveloperError, Vertex, Cartographic, CameraFlightPath, CameraCore, mixin,
            Log) {
  /**
   * @author Brendan Studds
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

    getPosition: function() {
      // TODO(aramk) This is accessing the global camera, not the current camera.
      var cesiumCamera = this._renderManager.getCesiumCamera(),
          cartesian = cesiumCamera.position;
      return this._renderManager.geoPointFromCartesian(cartesian);
    },

    getOrientation: function() {
      // TODO(aramk) This is accessing the global camera, not the current camera.
      return this._getOrientationFromCesiumCamera(this._renderManager.getCesiumCamera());
    },

    _getOrientationFromCesiumCamera: function(camera) {
      // TODO(aramk) Rotation not handled.
      var bearing = AtlasMath.toDegrees(camera.heading),
          tilt = AtlasMath.toDegrees(camera.tilt);
      return {bearing: bearing, rotation: 0, tilt: tilt}
    },

    // TODO(aramk) move direction to atlas.

    /**
     * Equivalent to setting
     * @param {atlas.model.Vertex} direction
     */
    setDirection: function(direction) {
      var cameraClone = this._renderManager.getCesiumCamera().clone();
      cameraClone.direction = direction;
      this.setOrientation(this._getOrientationFromCesiumCamera(cameraClone));
    },

    /**
     * @returns {atlas.model.Vertex}
     * @private
     */
    getDirection: function() {
      var camera = this._renderManager.getCesiumCamera(),
          direction = camera.direction;
      return new Vertex(direction);
    },

    _getDirectionFromOrientation: function(orientation) {

    },

    /**
     * @param {Object} direction
     * @returns The orientation based on the given direction.
     * @private
     */
    _getOrientationFromDirection: function(direction) {

    },

    // -------------------------------------------
    // TARGETED MOVEMENT
    // -------------------------------------------

    pointAt: function(point) {
      point = point.toRadians();
      var cesiumCamera = this._renderManager.getCesiumCamera(),
          ellipsoid = this._renderManager.getEllipsoid();
      // TODO(aramk) We need a utility method for converting GeoPoint to Cartographic and back.
      var targetCartographic = new Cartographic(point.longitude, point.latitude, point.elevation);
      var target = ellipsoid.cartographicToCartesian(targetCartographic);
      cesiumCamera.lookAt(cesiumCamera.position, target, cesiumCamera.up);
    },

    // -------------------------------------------
    // BEHAVIOUR
    // -------------------------------------------

    _animate: function(args) {
      args = mixin({}, args);
      // TODO(bpstudds): Allow for a non-default orientation.
      var point = this._position.toRadians(),
          destination = new Cartographic(point.longitude, point.latitude,
              point.elevation);
      var direction = this._getDirectionFromOrientation(this._orientation);
      var flight = CameraFlightPath.createAnimationCartographic(this._renderManager.getScene(), {
            destination: destination,
            direction: direction,
            duration: args.duration || 0
          }
      );
      // TODO(aramk) This affects the global camera, not the current camera.
      this._renderManager.getAnimations().add(flight);
      Log.debug('Animating camera to', this.getPosition(), this.getOrientation());
    }
  });
});

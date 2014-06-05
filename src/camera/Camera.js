define([
  // Base class.
  'atlas/camera/Camera',
  'atlas/model/Vertex',
  'atlas/lib/utility/Log',
  'atlas/lib/utility/Setter',
  'atlas/util/AtlasMath',
  'atlas/util/DeveloperError',
  'atlas-cesium/camera/CameraFlightPath',
  'atlas-cesium/cesium/Source/Core/Cartographic'
], function(CameraCore, Vertex, Log, Setter, AtlasMath, DeveloperError, CameraFlightPath,
            Cartographic) {
  /**
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

    setDirection: function(direction) {
      var cesiumCamera = this._renderManager.getCesiumCamera().clone();
      cesiumCamera.direction = direction;
      this.setOrientation(this._getOrientationFromCesiumCamera(cesiumCamera));
    },

    getDirection: function() {
      var camera = this._renderManager.getCesiumCamera(),
          direction = camera.direction;
      return new Vertex(direction);
    },

    getUp: function() {
      var camera = this._renderManager.getCesiumCamera(),
          up = camera.up;
      return new Vertex(up);
    },

    _getPositionAsCartesian: function(position) {
      var position = position.toRadians();
      var cartographic =
          new Cartographic(position.longitude, position.latitude, position.elevation);
      return this._renderManager.getEllipsoid().cartographicToCartesian(cartographic);
    },

    // -------------------------------------------
    // TARGETED MOVEMENT
    // -------------------------------------------

    /**
     * Changes the direction of the camera to point at the given point.
     * @param {atlas.model.GeoPoint} point
     */
    pointAt: function(point) {
      point = point.toRadians();
      var cesiumCamera = this._renderManager.getCesiumCamera(),
          ellipsoid = this._renderManager.getEllipsoid();
      var targetCartographic = new Cartographic(point.longitude, point.latitude, point.elevation);
      var target = ellipsoid.cartographicToCartesian(targetCartographic);
      cesiumCamera.lookAt(cesiumCamera.position, target, cesiumCamera.up);
    },

    // -------------------------------------------
    // BEHAVIOUR
    // -------------------------------------------

    _animate: function(args) {
      args = Setter.mixin({}, args);
      var position = args.position,
          orientation = args.orientation,
          point = position.toRadians();
      var destination = new Cartographic(point.longitude, point.latitude, point.elevation);
      var flightArgs = {
        destination: destination,
        duration: args.duration || 0,
        path: args.path
      };
      if (!args.direction && orientation) {
        // TODO(aramk) This is still somewhat problematic - giving default tilt still causes
        // strange angles and isn't stable when Cesium is loading. Just omit the orientation
        // if you're using the default during loading for now.

        // Use the given orientation in place of the direction.
        var cesiumCamera = this._renderManager.getCesiumCamera().clone();
        cesiumCamera.position = this._getPositionAsCartesian(position);
        cesiumCamera.tilt = AtlasMath.toRadians(orientation.tilt);
        cesiumCamera.heading = AtlasMath.toRadians(orientation.bearing);
        flightArgs.direction = cesiumCamera.direction;
        flightArgs.up = cesiumCamera.up;
        // TODO(aramk) Handle rotation.
      } else {
        flightArgs.direction = args.direction;
        flightArgs.up = args.up;
      }
      var flight = CameraFlightPath.createAnimationCartographic(this._renderManager.getScene(),
          flightArgs);
      // TODO(aramk) This affects the global camera, not the current camera.
      this._renderManager.getAnimations().add(flight);
      Log.debug('Animating camera to', position, orientation);
    }
  });
});

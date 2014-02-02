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

  /**
   * @classdesc The Camera object controls the position and orientation of the camera.
   * It exposes an API to set position and orientation, zoom to a given GeoEntity
   * or a bookmarked location, and to manual move the Camera.
   * @author Brendan Studds
   *
   * @param {atlas.render.RenderManager} renderManager - The current Atlas RendeManager instance.
   * @param {atlas.model.Vertex} [position] - The initial position of the Camera.
   * @property {Number} [position.x=-37] - The initial latitude (on the Earth's surface) in decimal degrees in the range [-90, 90].
   * @property {Number} [position.y=144] - The initial longitude (on the Earth's surface) in decimal degrees in the range [-180, 180].
   * @property {Number} [position.z=20000] - The initial elevation above the Earth's surface metres.
   * @param {atlas.model.Vertex} [orientation] - The initial orientation of the Camera.
   * @property {Number} [orientation.x=0] - The tilt (or pitch) about the Camera's transverse axis in decimal degrees in the range [0, 180]. At 0 degrees the Camera is pointing at the point directly below it, at 180 degrees it is looking the opposite direction.
   * @property {Number} [orientation.y=0] - The bearing (or yaw) about the normal axis from the surface to the camera in decimal degrees in the range [0, 360]. At 0 (and 360) degrees the Camera is facing North, 90 degrees it is facing East, etc.
   * @property {Number} [orientation.z=0] - The rotation (or roll) about the orientation vector of the Camera in decimal degrees in the range [-180, 180].
   *
   * @class atlas-cesium.camera.Camera
   * @extends atlas.camera.Camera
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

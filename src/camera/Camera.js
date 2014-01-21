define([
  'atlas/util/Extends',
  // Cesium imports
  'atlas-cesium/cesium/Source/Core/Cartographic',
  'atlas-cesium/cesium/Source/Scene/CameraFlightPath',
  // Base class.
  'atlas/camera/Camera'
], function (extend, Cartographic, CameraFlightPath, CameraCore) {

  var Camera = function (renderManager, position, orientation) {
    if (renderManager === undefined) {
      throw new DeveloperError('Can not create atlas-cesium Camera without specify render manager');
    }
    Camera.base.constructor.call(this, position, orientation);
    
    /* Inherited members
     *    _orientation
     *    _position
     */
    
    this._renderManager = renderManager;
  };
  extend(CameraCore, Camera);

  /*
   * Inherited functions:
   *    zoomTo(position, orientation, duration)
   *    pointAt(geoEntity)
   *    goTo()
   *    pointDown()
   */
  
  Camera.prototype._animateCamera = function (newCamera) {
    // TODO(bpstudds): Allow for a non-default orientation.
    console.debug('animating camera change');
    latitude = newCamera.position.x * Math.PI / 180;
    longitude = newCamera.position.y * Math.PI / 180;
    altitude = newCamera.position.z;
    var target = new Cartographic(longitude, latitude, altitude);
    var flight = CameraFlightPath.createAnimationCartographic(
      this._renderManager._widget.scene, {
        destination: target,
        duration: newCamera.duration
      }
    );
    this._renderManager._widget.scene.getAnimations().add(flight);
  }


  return Camera;
});
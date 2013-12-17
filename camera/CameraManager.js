define([
  'atlas/util/DeveloperError',
  'atlas/util/default',
  'atlas/util/Extends',
  'atlas-cesium/camera/Camera',
  // Base class
  'atlas/camera/CameraManager'
], function (DeveloperError, defaultValue, extend, Camera, CameraManagerCore) {
  
  var CameraManager = function (atlasManagers) {
    CameraManager.base.constructor.call(this, atlasManagers);
    
    this._atlasManagers = atlasManagers;
    this._atlasManagers.camera = this;
    
    this._camera = new Camera(this._atlasManagers.render);
  }
  extend(CameraManagerCore, CameraManager);
  
  /*
   * Inherited functions
   *    initialise()
   *    _bindEvents()
   *    createBookmark()
   *    removeBookmark()
   *    gotoBookmark()
   */
  
  return CameraManager;
});
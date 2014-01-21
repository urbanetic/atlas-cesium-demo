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
  
  CameraManager.prototype.lockCamera = function () {
    this._atlasManagers.render._widget.scene.getScreenSpaceCameraController().enableRotate = false;
    this._atlasManagers.render._widget.scene.getScreenSpaceCameraController().enableTranslate = false;
    this._atlasManagers.render._widget.scene.getScreenSpaceCameraController().enableZoom = false;
    this._atlasManagers.render._widget.scene.getScreenSpaceCameraController().enableTilt = false;
    this._atlasManagers.render._widget.scene.getScreenSpaceCameraController().enableLook = false;
  };
  
  CameraManager.prototype.unlockCamera = function () {
    this._atlasManagers.render._widget.scene.getScreenSpaceCameraController().enableRotate = true;
    this._atlasManagers.render._widget.scene.getScreenSpaceCameraController().enableTranslate = true;
    this._atlasManagers.render._widget.scene.getScreenSpaceCameraController().enableZoom = true;
    this._atlasManagers.render._widget.scene.getScreenSpaceCameraController().enableTilt = true;
    this._atlasManagers.render._widget.scene.getScreenSpaceCameraController().enableLook = true;
  };

  return CameraManager;
});


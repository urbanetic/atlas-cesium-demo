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

    this._camera = new Camera({renderManager: this._atlasManagers.render});
  };
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
    this._atlasManagers.render.getCameraController().enableRotate = false;
    this._atlasManagers.render.getCameraController().enableTranslate = false;
    this._atlasManagers.render.getCameraController().enableZoom = false;
    this._atlasManagers.render.getCameraController().enableTilt = false;
    this._atlasManagers.render.getCameraController().enableLook = false;
  };

  CameraManager.prototype.unlockCamera = function () {
    this._atlasManagers.render.getCameraController().enableRotate = true;
    this._atlasManagers.render.getCameraController().enableTranslate = true;
    this._atlasManagers.render.getCameraController().enableZoom = true;
    this._atlasManagers.render.getCameraController().enableTilt = true;
    this._atlasManagers.render.getCameraController().enableLook = true;
  };

  return CameraManager;
});


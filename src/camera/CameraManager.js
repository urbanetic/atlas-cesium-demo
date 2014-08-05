define([
  'atlas/camera/CameraManager',
  'atlas-cesium/camera/Camera'
], function(CameraManagerCore, Camera) {

  /**
   * @typedef atlas-cesium.camera.CameraManager
   * @ignore
   */
  var CameraManager;

  /**
   * @class atlas-cesium.camera.CameraManager
   */
  CameraManager = CameraManagerCore.extend(/** @lends atlas-cesium.camera.CameraManager# */{

    setup: function() {
      this._super();
      // TODO(aramk) Use factory.
      this._current = new Camera({renderManager: this._managers.render});
    },

    lockCamera: function() {
      var renderManager = this._managers.render;
      var controller = renderManager.getCameraController();
      controller.enableRotate = false;
      controller.enableTranslate = false;
      controller.enableZoom = false;
      controller.enableTilt = false;
      controller.enableLook = false;
    },

    unlockCamera: function() {
      var renderManager = this._managers.render;
      var controller = renderManager.getCameraController();
      controller.enableRotate = true;
      controller.enableTranslate = true;
      controller.enableZoom = true;
      controller.enableTilt = true;
      controller.enableLook = true;
    }

  });

  return CameraManager;
});


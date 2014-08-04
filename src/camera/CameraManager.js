define([
  'atlas/camera/CameraManager',
  'atlas-cesium/camera/Camera'
], function(CameraManager, Camera) {

  /**
   * @class atlas-cesium.manager.CameraManager
   */
  return CameraManager.extend(/** @lends atlas-cesium.manager.CameraManager# */{

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

});


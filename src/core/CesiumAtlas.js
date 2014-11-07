define([
  'atlas/core/Atlas',
  'atlas-cesium/camera/CameraManager',
  'atlas-cesium/dom/DomManager',
  'atlas-cesium/entity/EntityManager',
  'atlas-cesium/input/InputManager',
  'atlas-cesium/render/RenderManager'
], function(Atlas, CameraManager, DomManager, EntityManager, InputManager, RenderManager) {

  /**
   * @typedef atlas.core.CesiumAtlas
   * @ignore
   */
  var CesiumAtlas;

  /**
   * The facade of the atlas-cesium implementation.
   * @class atlas-cesium.core.CesiumAtlas
   */
  CesiumAtlas = Atlas.extend( /** @lends atlas-cesium.core.CesiumAtlas# */ {

    _initManagers: function() {
      this._super();
      [CameraManager, DomManager, EntityManager, InputManager, RenderManager].forEach(
        this.setManagerClass, this);
    }

  });

  return CesiumAtlas;
});
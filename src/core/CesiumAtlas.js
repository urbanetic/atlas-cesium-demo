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
  CesiumAtlas = Atlas.extend(/** @lends atlas-cesium.core.CesiumAtlas# */{

    _init: function() {
      this._super();

      this.setManager(new RenderManager(this._managers));
      this.setManager(new DomManager(this._managers));
      this.setManager(new InputManager(this._managers));
      this.setManager(new CameraManager(this._managers));

      /**
       * Contains a map of event name to EventHandler object.
       * @type {Object}
       * @private
       */
      this._eventHandlers = {};
    },

    _setup: function() {
      this._super();
      this._managers.camera.setup();
      this._managers.edit.setup();
      this._managers.render.setup();
    },

    /**
     * Attaches the CesiumAtlas instance to a particular DOM element.
     * @param {String|HTMLElement} elem - The DOM element to attach to.
     */
    attachTo: function(elem) {
      var dom = typeof elem === 'string' ? document.getElementById(elem) : elem;
      this._managers.dom.setDom(dom, true);
      // Hook up the InputManager to the selected DOM element.
      this._managers.input.setup(dom);
    }

  });

  return CesiumAtlas;
});

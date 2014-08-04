define([
  'atlas/core/Atlas',
  'atlas/edit/EditManager',
  'atlas/events/EventManager',
  'atlas/selection/SelectionManager',
  'atlas/visualisation/VisualisationManager',
  'atlas-cesium/camera/CameraManager',
  'atlas-cesium/dom/DomManager',
  'atlas-cesium/entity/EntityManager',
  'atlas-cesium/input/InputManager',
  'atlas-cesium/render/RenderManager'
], function(Atlas, EditManager, EventManager, SelectionManager, VisualisationManager, CameraManager,
            DomManager, EntityManager, InputManager, RenderManager) {

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

      // Create all the atlas manager objects before initialising any. Any initialisation work
      // that requires the presence of a particular manager is done in <code>setup()</code>,
      // so the managers may be created in any order.
      this.setManager(new EditManager(this._managers));
      this.setManager(new EntityManager(this._managers));
      this.setManager(new EventManager(this._managers));
      this.setManager(new RenderManager(this._managers));
      this.setManager(new DomManager(this._managers));
      this.setManager(new SelectionManager(this._managers));
      this.setManager(new InputManager(this._managers));
      this.setManager(new CameraManager(this._managers));
      this.setManager(new VisualisationManager(this._managers));

      // Setup the manager objects. These are independent unless stated otherwise.
      this._managers.camera.setup();
      this._managers.edit.setup();
      this._managers.render.setup();
      this._managers.entity.setup();
      this._managers.selection.setup();
      this._managers.visualisation.setup();

      /**
       * Contains a map of event name to EventHandler object.
       * @type {Object}
       * @private
       */
      this._eventHandlers = {};
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

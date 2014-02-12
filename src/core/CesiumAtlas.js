/*
 * The facade of the atlas-cesium implementation.
 */
define([
  'atlas/util/DeveloperError',
  'atlas/util/Extends',
  'atlas-cesium/camera/CameraManager',
  'atlas-cesium/dom/DomManager',
  'atlas/edit/EditManager',
  'atlas-cesium/entity/EntityManager',
  'atlas/events/EventManager',
  'atlas-cesium/input/InputManager',
  'atlas-cesium/render/RenderManager',
  'atlas/selection/SelectionManager',
  'atlas/visualisation/VisualisationManager',
  'atlas-cesium/model/Feature',
  'atlas-cesium/model/Polygon',
  // Extends
  'atlas/core/Atlas',
  'atlas/lib/utility/Log'
], function(DeveloperError, extend, CameraManager, DomManager, EditManager, EntityManager,
            EventManager, InputManager, RenderManager, SelectionManager, VisualisationManager,
            Feature, Polygon, Atlas, Log) {

  var CesiumAtlas = function() {
    // Call the atlas.core.Atlas constructor.
    CesiumAtlas.base.constructor.call(this);

    // Create all the atlas manager objects before initialising any. Any initialisation work
    // that requires the presence of a particular manager is done in <code>setup()</code>,
    // so the managers may be created in any order.
    this._managers.edit = new EditManager(this._managers);
    this._managers.entity = new EntityManager(this._managers);
    this._managers.event = new EventManager(this._managers);
    this._managers.render = new RenderManager(this._managers);
    this._managers.dom = new DomManager(this._managers);
    this._managers.selection = new SelectionManager(this._managers);
    this._managers.input = new InputManager(this._managers);
    this._managers.camera = new CameraManager(this._managers);
    this._managers.visualisation = new VisualisationManager(this._managers);

    // Setup the manager objects. These are independent unless stated otherwise.
    this._managers.camera.setup();
    this._managers.edit.setup();
    this._managers.render.setup();
    this._managers.entity.setup({constructors: {"Feature": Feature, "Polygon": Polygon}});
    //this._managers.input.setup(); // Initialise the InputManager after the DOM is set.
    this._managers.selection.setup();
    this._managers.visualisation.setup();

    /**
     * Contains a map of event name to EventHandler object.
     * @type {Object}
     * @private
     */
    this._eventHandlers = {};

    // And finally hook CesiumAtlas into any global events.
    this.bindEvents();
  };
  // Extend from atlas.core.Atlas.
  extend(Atlas, CesiumAtlas);

  /**
   * Attaches the CesiumAtlas instance to a particular DOM element.
   * @param {String|HTMLElement} elem - The DOM element to attach to.
   */
  CesiumAtlas.prototype.attachTo = function(elem) {
    this._managers.dom.setDom(elem, true);
    // Hook up the InputManager to the selected DOM element.
    this._managers.input.setup(elem);
  };

  /**
   * Registers event handlers with the EventManager for global events.
   */
  CesiumAtlas.prototype.bindEvents = function() {
    var handlerParams = [
      { // Define an event handler for showing an entity.
        source: 'extern',
        name: 'entity/show',
        callback: function(args) {
          var entity = this._managers.entity.getById(args.id);
          (!entity) && (entity = this.addFeature(args.id, args));
          Log.time('entity/show');
          entity.show();
          Log.timeEnd('entity/show');
        }.bind(this)
      },
      { // Define an event handler for hiding an entity.
        source: 'extern',
        name: 'entity/hide',
        callback: function(args) {
          var entity = this._managers.entity.getById(args.id);
          Log.time('entity/hide');
          entity.hide();
          Log.timeEnd('entity/hide');
        }.bind(this)
      }/*,
       // TODO(bpstudds): Move Overlay testing code somewhere intelligent.
       {
       source: 'intern',
       name: 'input/leftup',
       callback: function (args) {
       Log.debug('trying to show overlay');
       if (this.overlay !== undefined) this.overlay.hide();
       this.overlay = new Overlay(this._currentDomId,
       {
       top: args.y,
       left: args.x
       },
       '<p>x:' + args.x + ' y:' + args.y + '</p>'
       );
       this.overlay.show();
       }.bind(this._managers.dom)
       }*/
    ];
    // Add the event handlers to the EventManager.
    this._eventHandlers = this._managers.event.addEventHandlers(handlerParams);
  };

  /**
   * Creates and adds a new Feature object to atlas-cesium.
   * @param {String} id - The ID of the Feature to add.
   * @param {Object} args - Arguments describing the Feature to add.
   * @param {String|Array.atlas.model.Vertex} [args.footprint=null] - Either a WKT string or array
   * of Vertices describing the Features' footprint.
   * @param {Object} [args.mesh=null] - A object in the C3ML format describing the Features' Mesh.
   * @param {Number} [args.height=0] - The extruded height when displaying as a extruded polygon.
   * @param {Number} [args.elevation=0] - The elevation (from the terrain surface) to the base of
   * the Mesh or Polygon.
   * @param {Boolean} [args.show=false] - Whether the feature should be initially shown when
   * created.
   * @param {String} [args.displayMode='footprint'] - Initial display mode of feature, one of
   * 'footprint', 'extrusion' or 'mesh'.
   */
  Atlas.prototype.addFeature = function(id, args) {
    //return this._managers.render.addFeature(id, args);
    if (id === undefined) {
      throw new DeveloperError('Can add Feature without specifying id');
    } else {
      Log.debug('adding feature', id);
      // Add EventManger to the args for the feature.
      args.eventManager = this._managers.event;
      // Add the RenderManager to the args for the feature.
      args.renderManager = this._managers.render;
      return this._managers.entity.createFeature(id, args);
    }
  };

  return CesiumAtlas;
});

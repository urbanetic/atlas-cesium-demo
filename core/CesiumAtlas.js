/*
 * The facade of the atlas-cesium implementation.
 */
define([
  'atlas/util/DeveloperError',
  'atlas/util/Extends',
  'atlas/edit/EditManager',
  'atlas-cesium/entity/EntityManager',
  'atlas/events/EventManager',
  'atlas/selection/SelectionManager',
  'atlas-cesium/camera/CameraManager',
  'atlas-cesium/dom/DomManager',
  'atlas-cesium/input/InputManager',
  'atlas-cesium/render/RenderManager',
  'atlas-cesium/model/Feature',
  'atlas-cesium/model/Polygon',
  'atlas-cesium/cesium/Source/Core/Cartographic',
  // Extends
  'atlas/core/Atlas'
], function (DeveloperError, extend, EditManager, EntityManager, EventManager, SelectionManager, CameraManager, DomManager, InputManager, RenderManager, Feature, Polygon, Cartographic, Atlas) {

  var CesiumAtlas = function () {
    CesiumAtlas.base.constructor.call(this);

    // Create Managers.
    this._managers.edit = new EditManager(this._managers);
    this._managers.entity = new EntityManager(this._managers);
    this._managers.event = new EventManager(this._managers);
    this._managers.render = new RenderManager(this._managers);
    this._managers.dom = new DomManager(this._managers);
    this._managers.selection = new SelectionManager(this._managers);
    this._managers.input = new InputManager(this._managers);
    this._managers.camera = new CameraManager(this._managers);

    // Initialise managers as required.
    this.bindEvents();
    this._managers.camera.initialise();
    this._managers.edit.initialise();
    this._managers.entity.initialise({constructors: {"Feature": Feature, "Polygon": Polygon}})
    //this._managers.input.initialise(); // Have to initialise input after the DOM is set.
    this._managers.selection.initialise();

    /* CODE TO TEST SELECTION, IGNORE FOR THE MINUTE *
    // TODO(bpstudds): Remove this event handler and do it proper.
    this._managers.event.addEventHandler('intern', 'input/leftclick', function (name, args) {
      // Is there an entity here
      var picked = this._managers.render._widget.scene.pick(args);
      if (!picked) return;

      console.debug('clicked on', picked);
      // Select it
      this._managers.selection.selectEntity(picked.id);
      // Hide it
      // this._managers.render.hide(picked.id);
    }.bind(this));

    // TODO(bpstudds): Remove this event handler and do it proper.
    this._managers.event.addEventHandler('intern', 'input/rightdown', function (name, args) {
      // Is there an entity here
      var picked = this._widget.scene.pick(args);
      if (!picked) return;

      console.debug('rightdown on', picked);
      this.dragEntity = picked.id;
      console.debug(this.getEntity(picked.id));
      var centroid = this.getEntity(picked.id).getCentroid();
      this.dragStart = { longitude: centroid.y, latitude: centroid.x };
    }.bind(this._managers.render));

    // TODO(bpstudds): Remove this event handler and do it proper.
    this._managers.event.addEventHandler('intern', 'input/rightup', function (name, args) {
      // Was a drag taking place?
      if (!this.dragEntity) return;

      this.dragStop = this._widget.centralBody.getEllipsoid().cartesianToCartographic(this._widget.scene.getCamera().controller.pickEllipsoid(args));
      this.dragStop = { longitude: this.dragStop.longitude, latitude: this.dragStop.latitude };
      this.dragStop.longitude *= 180 / Math.PI;
      this.dragStop.latitude *= 180 / Math.PI;
      var diff = { x: this.dragStop.latitude - this.dragStart.latitude, y: this.dragStop.longitude - this.dragStart.longitude };
      //console.debug('dragged', this.dragEntity, 'frobm', this.dragStart, 'to', dragStop);
      console.log('dragged', this.dragEntity, diff);
      this.dragEntity = null;
    }.bind(this._managers.render));
    */
  };
  extend(Atlas, CesiumAtlas);

  CesiumAtlas.prototype.attachTo = function (elem) {
    this._managers.dom.setDom(elem, true);
    // Hook up the InputManager to the selected DOM element.
    this._managers.input.initialise(elem);
  };
  
  /**
   * Registers event handlers with the EventManager.
   */
  CesiumAtlas.prototype.bindEvents = function () {
    var handlers = [
      { // Define an event handler for showing an entity.
        source: 'extern',
        name: 'entity/show',
        callback: function (event, args) {
          // TODO(bpstudds): Move the adding of entities somewhere intelligent.
          this.addFeature(args.id, args);
        }.bind(this)
      },
      { // Define an event handler for hiding an entity.
        source: 'extern',
        name: 'entity/hide',
        callback: function (event, args) {
          // TODO(bpstudds): Move the adding of entities somewhere intelligent.
          this.addFeature(args.id, args);
        }.bind(this)
      }
    ];
    // Add the event handlers to the EventManager.
    this._managers.event.addEventHandlers(handlers);
  };  

  Atlas.prototype.addFeature = function (id, args) {
    //return this._managers.render.addFeature(id, args);
    if (id === undefined) {
      throw new DeveloperError('Can add Feature without specifying id');
    } else {
      console.debug('adding feature', id);
      // Add EventManger to the args for the feature.
      args.eventManager = this._managers.event;
      // Add the RenderManager to the args for the feature.
      args.renderManager = this._managers.render;
      var feature = this._managers.entity.createFeature(id, args);
      this._managers.entity.add(id, feature);
      if (args.show) feature.show();
      //return feature;
    }
  };

  return CesiumAtlas;
});
/*
 * The facade of the atlas-cesium implementation.
 */
define([
  'atlas/util/Extends',
  'atlas/events/EventManager',
  'atlas-cesium/dom/DomManager',
  'atlas-cesium/render/RenderManager',
  'atlas-cesium/model/Feature',
  'atlas-cesium/model/Polygon',
  // Extends
  'atlas/core/Atlas'
], function (extend, EventManager, DomManager, RenderManager, Feature, Polygon, Atlas) {

  var CesiumAtlas = function () {
    CesiumAtlas.base.constructor.call(this);

    /* Inherited from Atlas
    this._managers;
    */
    // Create Managers.
    this._managers.event = new EventManager(this._managers);
    this._managers.render = new RenderManager(this._managers);
    this._managers.dom = new DomManager(this._managers);

    // Initialise managers as required.
    this._managers.render.bindEvents();
  };
  extend(Atlas, CesiumAtlas);

  CesiumAtlas.prototype.attachTo = function (elem) {
     this._managers.dom.setDom(elem, true);
  };

  Atlas.prototype.addFeature = function (id, args) {
    //return this._managers.render.addFeature(id, args);
     if (id === undefined) {
       throw new DeveloperError('Can add Feature without specifying id');
     } else {
       // Add EventManger to the args for the feature.
       args.eventManager = this._managers.event;
       // Add the RenderManager to the args for the feature.
       args.renderManager = this._managers.render;
       var feature = new Feature(id, args);
       this._managers.render.addEntity(feature);
       //return feature;
     }
  };

  return CesiumAtlas;
});
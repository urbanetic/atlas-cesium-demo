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
  'atlas/Atlas'
], function (extend, EventManager, DomManager, RenderManager, Feature, Polygon, Atlas) {

  var CesiumAtlas = function () {
    CesiumAtlas.base.constructor.call(this);

    /* Inherited from Atlas
    this._managers;
    */
    this._managers.events = new EventManager(this._managers);
    this._managers.render = new RenderManager(this._managers);
    this._managers.dom = new DomManager(this._managers);
    console.log(this.addFeature);
  };
  extend(Atlas, CesiumAtlas);

  // CesiumAtlas.prototype.attachTo = function (elem) {
  //   this.managers.dom.setDom(elem, true);
  // };

  Atlas.prototype.addFeature = function (id, args) {
    if (typeof id === 'undefined') {
      throw new DeveloperError('Can add Feature without specifying id');
    } else {
      // Add EventManger to the args for the feature.
      args.eventManager = this._managers.event;
      // Add the RenderManager to the args for the feature.
      args.renderManager = this._managers.render;
      var feature = new Feature(id, args);
      this._managers.render.addEntity(feature);
      return feature;
    }
  };

  CesiumAtlas.prototype.addPolygon = function (id, vertices, args) {
    console.log('creating id', id);
    if (typeof id === 'undefined') {
      throw new DeveloperError('Can not create entity without an ID');
    }
    var polygon = new Polygon(id, vertices, args);
    console.log('poly is visible', polygon.isVisible());
    if (polygon instanceof Polygon) {
      console.log('constructed polygon', polygon);
      this._managers.render.addEntity(polygon);
      this._managers.render.show(id);
    } else {
      console.log('have', polygon);
      throw 'Error constructing polygon';
    }
    return polygon;
  };

  return CesiumAtlas;
});
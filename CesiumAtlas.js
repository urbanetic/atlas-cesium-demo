/*
 * The facade of the atlas-cesium implementation.
 */
define([
  'atlas/util/Extends',
  'atlas-cesium/dom/DomManager',
  'atlas-cesium/render/RenderManager',
  'atlas-cesium/model/Polygon',
  // Extends
  'atlas/Atlas'
], function (extend, DomManager, RenderManager, Polygon, Atlas) {

  var CesiumAtlas = function () {
    CesiumAtlas.base.constructor.call(this);
    this.managers['render'] = new RenderManager();
    this.managers['dom'] = new DomManager(this.managers.render);
  };
  extend(Atlas, CesiumAtlas);

  CesiumAtlas.prototype.attachTo = function (elem) {
    this.managers.dom.setDom(elem, true);
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
      this.managers['render'].addEntity(polygon);
      this.managers['render'].show(id);
    } else {
      console.log('have', polygon);
      throw 'Error constructing polygon';
    }
    return polygon;
  };

  return CesiumAtlas;
});
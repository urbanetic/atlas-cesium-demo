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
], function (extend, DomManager, RenderManager, Atlas, Polygon) {

  var CesiumAtlas = function () {
    CesiumAtlas.base.constructor.call(this);
    this.managers.render = new RenderManager();
    this.managers.dom = new DomManager(this.managers.render);
  };
  extend(Atlas, CesiumAtlas);

  CesiumAtlas.prototype.attachTo = function (elem) {
    this.managers.dom.setDom(elem, true);
  };

  CesiumAtlas.prototype.addPolygon = function (id, vertices, args) {
    if (id === undefined) {
      throw new DeveloperError('Can not create entity without an ID');
    }

    var polygon;
    if (typeof vertices === 'String') {
      // Assume vertices is a valid WKT string
      polygon = Polygon.fromWKT(id, vertices, args);
    } else {
      polygon = new Polygon(id, vertices, args);
    }
    this.managers.render.add(polygon);
    this.managers.render.show(id);
    return polygon;    
  };

  return CesiumAtlas;
});
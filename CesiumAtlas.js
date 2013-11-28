/*
 * The facade of the atlas-cesium implementation.
 */
define([
  'atlas/util/Extends',
  'atlas-cesium/dom/DomManager',
  'atlas-cesium/render/RenderManager',
  // Extends
  'atlas/Atlas'
], function (extend, DomManager, RenderManager, Atlas) {

  var CesiumAtlas = function () {
    CesiumAtlas.base.constructor.call(this);
    this.managers.render = new RenderManager();
    this.managers.dom = new DomManager(this.managers.render);
  };
  extend(Atlas, CesiumAtlas);

  CesiumAtlas.prototype.attachTo = function (elem) {
    this.managers.dom.setDom(elem, true);
  };

  CesiumAtlas.prototype.addPolygon = function (params) {
    if (params.id === undefined) {
      throw new DeveloperError('Can not create entity without an ID');
    }
    var polygon = new Polygong(params.id, params.parent. params.vertices, params.height, params.elevation, params.style, params.material);
    this.managers.render.add(polygon);
    return polygon;    
  };

  return CesiumAtlas;
});
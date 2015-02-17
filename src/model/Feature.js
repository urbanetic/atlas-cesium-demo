define([
  'atlas-cesium/model/Ellipse',
  'atlas-cesium/model/GltfMesh',
  'atlas-cesium/model/Image',
  'atlas-cesium/model/Line',
  'atlas-cesium/model/Mesh',
  'atlas-cesium/model/Point',
  'atlas-cesium/model/Polygon',
  // Base class
  'atlas/model/Feature'
], function(Ellipse, GltfMesh, Image, Line, Mesh, Point, Polygon, Feature) {
  /**
   * @classdesc A Feature represents an entity that can be visualised either
   * as a 2D footprint, an 3D extrusion of said footprint, or a 3D mesh.
   *
   * @param {Number} id - The ID of this Feature.
   * @param {Object} args - Parameters describing the feature.
   * @param {atlas.render.RenderManager} args.renderManager - The RenderManager object responsible
   * for rendering the Feature.
   * @param {atlas.events.EventManager} args.eventManager - The EventManager object responsible for
   * the event system.
   * @param {String|Array.<atlas.model.Vertex>} [args.polygon=null] - Either a WKT string or array
   * of Vertices describing the footprint polygon.
   * @param {atlas.model.Mesh} [args.mesh=null] - The Mesh object for the Feature.
   * @param {Number} [args.height=0] - The extruded height when displaying as a extruded polygon.
   * @param {Number} [args.elevation=0] - The elevation (from the terrain surface) to the base of
   * the Mesh or Polygon.
   * @param {Boolean} [args.show=true] - Whether the feature should be initially shown when
   * created.
   * @param {String} [args.displayMode='footprint'] - Initial display mode of feature, one of
   * 'footprint', 'extrusion' or 'mesh'.
   *
   * @class atlas-cesium.model.Feature
   * @extends atlas.model.Feature
   */
  return Feature.extend(/** @lends atlas-cesium.model.Feature# */ {

    _formConstructors: {
      Point: Point,
      Line: Line,
      Polygon: Polygon,
      Ellipse: Ellipse,
      Mesh: Mesh,
      GltfMesh: GltfMesh,
      Image: Image
    }

  });
});

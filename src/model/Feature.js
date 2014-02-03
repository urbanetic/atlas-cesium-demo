define([
  'atlas-cesium/model/Polygon',
  'atlas-cesium/model/Mesh',
  // Base class
  'atlas/model/Feature'
], function (Polygon, Mesh, FeatureCore) {


  /**
   * @classdesc A Feature represents an entity that can be visualised either
   * as a 2D footprint, an 3D extrusion of said footprint, or a 3D mesh.
   *
   * @param {Number} id - The ID of this Feature.
   * @param {Object} args - Parameters describing the feature.
   * @param {atlas.render.RenderManager} args.renderManager - The RenderManager object responsible for rendering the Feature.
   * @param {atlas.events.EventManager} args.eventManager - The EventManager object responsible for the event system.
   * @param {String|Array.<atlas.model.Vertex>} [args.footprint=null] - Either a WKT string or array of Vertices describing the footprint polygon.
   * @param {atlas.model.Mesh} [args.mesh=null] - The Mesh object for the Feature.
   * @param {Number} [args.height=0] - The extruded height when displaying as a extruded polygon.
   * @param {Number} [args.elevation=0] - The elevation (from the terrain surface) to the base of the Mesh or Polygon.
   * @param {Boolean} [args.show=false] - Whether the feature should be initially shown when created.
   * @param {String} [args.displayMode='footprint'] - Initial display mode of feature, one of 'footprint', 'extrusion' or 'mesh'.
   *
   * @class atlas-cesium.model.Feature
   * @extends atlas.model.Feature
   */
  return FeatureCore.extend( /** @lends atlas-cesium.model.Feature# */ {
    _init: function (id, args) {
      this._super(id, args);
      if (args.mesh) {
        this._mesh = new Mesh(id + 'mesh', args.mesh, args);
      }
      if (args.footprint) {
        args.vertices = args.footprint;
        this._footprint = new Polygon(id + 'polygon', args);
      }
    }
  });
});


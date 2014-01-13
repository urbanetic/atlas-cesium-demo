define([
  'atlas/util/Extends',
  'atlas-cesium/model/Polygon',
  'atlas-cesium/model/Mesh',
  // Base class
  'atlas/model/Feature'
], function (extend, Polygon, Mesh, FeatureCore) {


  /**
   * Constructs a new Feature object.
   * @class A Feature represents an entity that can be visualised either
   * as a 2D footprint, an 3D extrusion of said footprint, or a 3D mesh.
   *
   * @param {Number} id - The ID of this Feature.
   * @param {Object} args - Parameters describing the feature.
   * @param {atlas.render.RenderManager} args.renderManager - The RenderManager object responsible for rendering the Feature.
   * @param {atlas.events.EventManager} args.eventManager - The EventManager object responsible for the event system.
   * @param {String|Array.atlas.model.Vertex} [args.footprint=null] - Either a WKT string or array of Vertices describing the footprint polygon.
   * @param {atlas.model.Mesh} [args.mesh=null] - The Mesh object for the Feature.
   * @param {Number} [args.height=0] - The extruded height when displaying as a extruded polygon.
   * @param {Number} [args.elevation=0] - The elevation (from the terrain surface) to the base of the Mesh or Polygon.
   * @param {Boolean} [args.show=false] - Whether the feature should be initially shown when created.
   * @param {String} [args.displayMode='footprint'] - Initial display mode of feature, one of 'footprint', 'extrusion' or 'mesh'.
   *
   * @extends {atlas.model.Feature}
   * @alias atlas-cesium.model.Feature
   * @constructor
   */
  var Feature = function (id, args) {
    if (typeof id === 'object') {
      args = id;
      id = args.id;
    }
    Feature.base.constructor.call(this, id, args);

    /**
     * The 2D {@link Polygon} footprint of this Feature.
     * @override
     * @type {Polygon}
     */
    this._footprint = null;
    if (args.footprint !== undefined) {
      this._footprint = new Polygon(id + 'polygon', args.footprint, args);
    }

    /**
     * 3D {@link Mesh} of this Feature.
     * @override
     * @type {Mesh}
     */
    this._mesh = null;
    if (args.mesh !== undefined) {
      this._mesh = new Mesh(id + 'mesh', args.mesh, args);
    }

  };
  extend(FeatureCore, Feature);

  return Feature;
});


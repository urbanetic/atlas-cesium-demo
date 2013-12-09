define([
  'atlas/util/Extends',
  'atlas-cesium/model/Polygon',
  'atlas/model/Mesh',
  // Base class
  'atlas/model/Feature'
], function (extend, Polygon, Mesh, FeatureCore) {

  var Feature = function (/*Number*/ id, /*Object*/ args) {
    if (typeof id === 'object') {
      args = id;
      id = args.id;
    }
    Feature.base.constructor.call(this, id, args);

    /**
     * The 2d {@link Polygon} footprint of this Feature.
     * @override
     * @type {Polygon}
     */
    this._footprint = null;
    if (args.vertices !== undefined) {
      this._footprint = new Polygon(id + 'polygon', args.vertices, args);
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


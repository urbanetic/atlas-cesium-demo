define([
  'atlas/util/Extends',
  'atlas-cesium/model/Feature',
  'atlas-cesium/model/Polygon',
  'atlas-cesium/model/Mesh',
  // Base class
  'atlas/entity/EntityManager'
], function (extend, Feature, Polygon, Mesh, EntityManagerCore) {

  var EntityManager = function (atlasManagers) {
    EntityManager.base.constructor.call(this, atlasManagers);
    
    this._atlasManagers = atlasManagers;
    this._atlasManagers.entity = this;

    /**
     * Contains a mapping of ID to GeoEntity of all GeoEntities in atlas.
     * @type {Object.<String, atlas/model/GeoEntity>}
     */
    this._entities = {};

    /**
     * Contains a mapping of GeoEntity subclass names to the constructor object
     * used to create that GeoEntity. Allows overriding of the default atlas GeoEntities
     * without having to subclass the EntityManager.
     * @type {Object.<String, Function>}
     */
    this._entityTypes = {
      'Feature': Feature,
      'Polygon': Polygon,
      'Mesh': Mesh
    };
  };
  extend(EntityManagerCore, EntityManager);
  
  /*
   * Inherited from atlas/entity/EntityManager
   *    setGeoEntityTypes(constructors)
   *    createFeature(id, args)
   *    add(id, entity)
   *    remove(id)
   *    getById(id)
   */

  EntityManager.prototype.initialise = function (args) {
    if (args.constructors) {
      this.setGeoEntityTypes(args.constructors);
    }
  };

  /**
   * Returns the GeoEntity that intersects the given Vertex or undefined.
   * @param {atlas/model/Vertex} point - The point of interest.
   * @returns {atlas/model/GeoEntity|undefined} The GeoEntity located at the given screen coordinates,
   * or <code>undefined</code> if there is no such GeoEntity.
   */
  EntityManager.prototype.getAt = function (point) {
    var ids = this._atlasManagers.render.getAt(point);
    var entities = [];
    ids.forEach(function (id) {
      entities.push(this.getById(id));
    }.bind(this));
    return entities;
  };

  /**
   * Returns the GeoEntities located within the given Polygon.
   * @param {atlas/model/Polygon} boundingPoly - The polygon defining the geographic area to
   *      retrieve GeoEntities.
   * @param {Boolean} [intersects] - If true, GeoEntities which intersect the boundingBox are
   *      returned as well. Otherwise, only wholly contains GeoEntities are returned.
   * @returns {atlas/model/GeoEntity|undefined} The GeoEntities located in the bounding box,
   *      or <code>undefined</code> if there are no such GeoEntities.
   */
  EntityManager.prototype.getInPoly = function (boundingPoly, intersects) {
    // TODO
    // See mutopia-gui cesium extensions. Aram converted the target point and visible polygons
    // to WKT and then used OpenLayers to find the intersecting entities.
    throw 'EntityManager.getInPoly not yet implemented.'
  };

  EntityManager.prototype.getInRect = function (start, end) {
    // TODO
    // See mutopia-gui cesium extensions. Aram converted the target point and visible polygons
    // to WKT and then used OpenLayers to find the intersecting entities.
    throw 'EntityManager.getInRect not yet implemented.'
  };

  return EntityManager;
});

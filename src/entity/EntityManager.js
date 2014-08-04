define([
  'atlas/model/GeoEntity',
  'atlas-cesium/model/Ellipse',
  'atlas-cesium/model/Feature',
  'atlas-cesium/model/Image',
  'atlas-cesium/model/Line',
  'atlas-cesium/model/Polygon',
  'atlas-cesium/model/Mesh',
  // Base class
  'atlas/entity/EntityManager'
], function (GeoEntity, Ellipse, Feature, Image, Line, Polygon, Mesh, EntityManagerCore) {

  var EntityManager = EntityManagerCore.extend( /** @lends atlas-cesium.entity.EntityManager# */ {

    /**
     * Contains a mapping of GeoEntity subclass names to the constructor object
     * used to create that GeoEntity. Allows overriding of the default atlas GeoEntities
     * without having to subclass the EntityManager.
     * @type {Object.<String, Function>}
     */
    _entityTypes: {
      Ellipse: Ellipse,
      Feature: Feature,
      Image: Image,
      Line: Line,
      Mesh: Mesh,
      Polygon: Polygon
    },

    /**
     * Returns the GeoEntities that intersect the given screen coordinates.
     * @param {atlas.model.Vertex} point - The screen coordinates.
     * @returns {Array.<atlas.model.GeoEntity>} The GeoEntities located at the given screen coordinates.
     */
    getAt: function (point) {
      // Get the Entities at the given screen coordinates.
      var ids = this._managers.render.getAt(point);
      // Translate entity IDs to entity objects.
      var entities = [];
      ids.forEach(function (id) {
        var entity = this.getById(id);
        if (entity instanceof GeoEntity) {
          entities.push(this.getById(id));
        }
      }, this);
      return entities;
    },

    /**
     * Returns the GeoEntities located within the given Polygon.
     * @param {atlas.model.Polygon} boundingPoly - The polygon defining the geographic area to
     *      retrieve GeoEntities.
     * @param {Boolean} [intersects] - If true, GeoEntities which intersect the boundingBox are
     *      returned as well. Otherwise, only wholly contains GeoEntities are returned.
     * @returns {atlas.model.GeoEntity|undefined} The GeoEntities located in the bounding box,
     *      or <code>undefined</code> if there are no such GeoEntities.
     */
    getInPoly: function (boundingPoly, intersects) {
      // TODO
      // See catalyst-gui cesium extensions. Aram converted the target point and visible polygons
      // to WKT and then used OpenLayers to find the intersecting entities.
      throw 'EntityManager.getInPoly not yet implemented.'
    },

    getInRect: function (start, end) {
      // TODO
      // See catalyst-gui cesium extensions. Aram converted the target point and visible polygons
      // to WKT and then used OpenLayers to find the intersecting entities.
      throw 'EntityManager.getInRect not yet implemented.'
    }
  });
  return EntityManager;
});

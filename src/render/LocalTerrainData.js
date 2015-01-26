define([
  'atlas/lib/utility/Class',
  'atlas/lib/utility/Log',
  'atlas/model/HeightMap',
  'atlas-cesium/model/GltfMesh'
], function(Class, Log, HeightMap, GltfMesh) {

  var LocalTerrainData;

  LocalTerrainData = Class.extend(/** @lends atlas-cesium.render.LocalTerrainData# */ {

    /**
     * The Mesh visualising the local terrain.
     *
     * @type {atlas.model.Mesh}
     * @private
     */
    _mesh: null,

    /**
     * Heightmap of the local terrain.
     *
     * @type {atlas.model.HeightMap}
     * @private
     */
    _heightMap: null,

    /**
     * Whether the LocalTerrainData is ready to provide terrain elevation data.
     *
     * @typedef {boolean}
     * @public
     */
    ready: false,

    _init: function(args) {
      if (!args.heightMap) {
        throw new Error('Must specify local terrain height map');
      }
      if (!args.mesh) {
        throw new Error('Must specify local terrain mesh');
      }

      this._heightMap = new HeightMap(args.heightMap);
      var centroid = this._heightMap._centroidFromGeoLocation();
      args.mesh.geoLocation = centroid;
      this._mesh = new GltfMesh('local-terrain', args.mesh, {renderManager: args.renderManager});
      this.ready = true;
    },

    /**
     * Samples the terrain at a set of GeoPoints, returning the height of the terrain at those
     * locations.
     *
     * @param {Array.<atlas.model.GeoPoint>} geoPoints - The GeoPoints to sample the terrain at.
     * @returns {Array.<Number>|null} The terrain height at the sampled points, or <code>null</code>
     *     if the given GeoPoints do not coincide with the terrain.
     */
    sampleTerrain: function(geoPoints) {
      return this._heightMap.sampleTerrain(geoPoints);
    },

    getHeightMap: function() {
      return this._heightMap;
    },

    getMesh: function() {
      return this._mesh;
    },

    /**
     * Shows the terrain.
     */
    show: function() {
      this._mesh.show();
    },

    /**
     * Hides the terrain.
     */
    hide: function() {
      this._mesh.hide();
    },

  });

  return LocalTerrainData;

});

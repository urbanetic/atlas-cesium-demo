define([
  'atlas/lib/utility/Log',
  'atlas/lib/utility/Types',
  'atlas/render/TerrainManager',
  'atlas-cesium/cesium/Source/Core/EllipsoidTerrainProvider',
  'atlas-cesium/cesium/Source/Core/CesiumTerrainProvider',
], function(Log, Types, CoreTerrainManager, EllipsoidTerrainProvider, CesiumTerrainProvider) {

  /**
   * @typedef atlas-cesium.render.TerrainManager
   * @ignore
   */
  var TerrainManager;

  TerrainManager = CoreTerrainManager.extend(/** @lends atlas-cesium.render.TerrainManager# */ {

    /**
     * Terrain elevation data provider using Cesium's hosted data.
     *
     * @type {TerrainProvider}
     *
     * @private
     */
    _cesiumProvider: null,

    /**
     * Default terrain elevation data provider. Provides the elevation data for a standard WGS84
     * ellipsoid.
     *
     * @type {TerrainProvider}
     *
     * @private
     */
    _ellipsoidTerrain: null,

    /**
     * Sets the visibility of terrain.
     *
     * @param {Boolean} enabled - Whether the terrain should be enabled.
     */
    _handleEnabledChange: function(enabled) {
      this._super(enabled);

      var scene = this._managers.render.getScene();
      if (enabled) {
        scene.terrainProvider = this._getCesiumProvider();
        scene.globe.enableLighting = true;
      } else {
        scene.terrainProvider = this._getEllipsoidProvider();
        scene.globe.enableLighting = false;
      }
      // Shift any existing entities
      this._managers.entity.getEntities().forEach(function(entity) {
        this._shiftEntityForTerrain(entity, enabled);
      }, this);
    },

    _getCesiumProvider: function() {
      if (!this._cesiumProvider) {
        var terrainProvider = new CesiumTerrainProvider({
            url : '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
        });
        this._cesiumProvider = terrainProvider;
      }
      return this._cesiumProvider;
    },

    _getEllipsoidProvider: function() {
      if (!this._ellipsoidTerrain) {
        this._ellipsoidTerrain = new EllipsoidTerrainProvider();
      }
      return this._ellipsoidTerrain;
    }

  });

  return TerrainManager;

});

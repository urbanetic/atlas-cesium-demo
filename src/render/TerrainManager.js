define([
  'atlas/render/TerrainManager',
  'atlas-cesium/cesium/Source/Core/EllipsoidTerrainProvider',
  'atlas-cesium/cesium/Source/Core/CesiumTerrainProvider',
], function(CoreTerrainManager, EllipsoidTerrainProvider, CesiumTerrainProvider) {

  /**
   * @typedef atlas-cesium.render.TerrainManager
   * @ignore
   */
  var TerrainManager;

  TerrainManager = CoreTerrainManager.extend(/** @lends atlas-cesium.render.TerrainManager# */ {

    /**
     * Cesium provider of terrain elevation data.
     *
     * @type {TerrainProvider}
     *
     * @private
     */
    _terrainProvider: null,

    /**
     * The original WGS84 ellipsoid terrain provider, used to disable actual 3D terrain.
     * @type {TerrainProvider}
     */
    _ellipsoidTerrain: null,

    /**
     * Sets the visibility of terrain.
     *
     * @param {Boolean} show - Whether the terrain should be visible.
     */
    setEnabled: function(show) {
      this._super(show);

      var scene = this._managers.render.getScene();
      if (show) {
        if (!this._terrainProvider) {
          var terrainProvider = new CesiumTerrainProvider({
              url : '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
          });
          this._terrainProvider = terrainProvider;
        }
        scene.terrainProvider = this._terrainProvider;
        scene.globe.enableLighting = true;
      } else {
        if (!this._ellipsoidTerrain) {
          this._ellipsoidTerrain = new EllipsoidTerrainProvider();
        }
        scene.terrainProvider = this._ellipsoidTerrain;
        scene.globe.enableLighting = false;
      }
    }

  });

  return TerrainManager;

});

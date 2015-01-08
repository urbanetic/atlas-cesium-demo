define([
  'atlas/render/TerrainManager',
  'atlas-cesium/cesium/Source/Core/CesiumTerrainProvider',
], function(CoreTerrainManager, CesiumTerrainProvider) {

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
     * Sets the visibility of terrain.
     *
     * @param {Boolean} show - Whether the terrain should be visible.
     */
    setTerrainVisibility: function(show) {
      this._super(show);

      var scene = this.getScene();
      if (show) {
        if (!this._terrainProvider) {
          var terrainProvider = new CesiumTerrainProvider({
              url : '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
          });
          this._terrainProvider = terrainProvider;
        }
        scene.terrainProvider = this._terrainProvider;
      } else {
        scene.terrainProvider = undefined;
      }
    }

  });

  return TerrainManager;

});

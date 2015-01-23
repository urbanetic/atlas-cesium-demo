define([
  'atlas/lib/utility/Class',
  'atlas/lib/utility/Types',
  'atlas-cesium/cesium/Source/Core/CesiumTerrainProvider',
  'atlas-cesium/cesium/Source/Core/TerrainProvider',
  'atlas-cesium/cesium/Source/Widgets/BaseLayerPicker/ProviderViewModel',
], function(Class, Types, CesiumTerrainProvider, TerrainProvider, ProviderViewModel) {

  /**
   * @typedef atlas-cesium.render.LocalTerrainProvider
   * @ignore
   */
  var LocalTerrainProvider;

  /**
   * @classdesc Provides the ability to override a "global" terrain model with terrain data for
   * specified regions.
   *
   * @class atlas.render.LocalTerrainProvider
   * @implements {TerrainProvider}
   */
  LocalTerrainProvider = Class.extend(/** @lends atlas.render.LocalTerrainProvider# */ {
    /**
     * The Cesium Terrain Provider.
     *
     * @type {TerrainProvider}
     * @private
     */
    _cesiumProvider: null,

    /**
     * The local terrain provider.
     *
     * @type {TerrainProvider}
     * @private
     */
    _localTerrain: null,

    _init: function() {
      this._cesiumProvider = this._getCesiumProvider();
      this._initDelegation();
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

    //
    // Delegate To Cesium Terrain Provider
    //
    getRegularGridIndices: function() {
      return TerrainProvider.getRegularGridIndices.apply(null, arguments);
    },


    getEstimatedLevelZeroGeometricErrorForAHeightmap: function() {
      return TerrainProvider
          .getEstimatedLevelZeroGeometricErrorForAHeightmap.apply(null, arguments);
    },

    _initDelegation: function() {
      var terrainProviderMethods = ['requestTileGeometry', 'getLevelMaximumGeometricError',
          'getTileDataAvailable'];
      terrainProviderMethods.forEach(function(method) {
        this[method] = function() {
          var cp = this._getCesiumProvider();
          return cp[method].apply(cp, arguments);
        };
      }, this);
    }

  });

  // Using ECMA script getters so we get delegate "static" properties to the underlying Cesium
  // terrain provider.
  Object.defineProperties(LocalTerrainProvider.prototype, {
    errorEvent: {
      get: function() {
        return this._cesiumProvider.errorEvent;
      }
    },

    credit: {
      get: function() {
        return this._cesiumProvider.credit;
      }
    },

    tilingScheme: {
      get: function() {
        return this._cesiumProvider.tilingScheme;
      }
    },

    hasWaterMark: {
      get: function() {
        return this._cesiumProvider.hasWaterMark;
      }
    },

    hasVertexNormals: {
      get: function() {
        return this._cesiumProvider.hasVertexNormals;
      }
    },

    requestVertexNormals: {
      get: function() {
        return this._cesiumProvider.requestVertexNormals;
      }
    },

    heightmapTerrainQuality: {
      get: function() {
        return this._cesiumProvider.heightmapTerrainQuality;
      }
    },

    ready: {
      get: function() {
        return this._cesiumProvider.ready;
      }
    }
  });

  return LocalTerrainProvider;

});

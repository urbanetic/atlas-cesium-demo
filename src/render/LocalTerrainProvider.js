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
   * @class  atlas.render.LocalTerrainProvider
   * @implements {TerrainProvider}
   */
  LocalTerrainProvider = Class.extend(/** @lends atlas.render.LocalTerrainProvider# */ {
    /**
     * The Cesium Terrain Provider.
     * @type {TerrainProvider}
     */
    _cesiumProvider: null,

    /**
     * The local terrain provider.
     * @type {TerrainProvider}
     */
    _localTerrain: null,

    _init: function() {
      this._cesiumProvider = this._getCesiumProvider();
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

    // getViewModel: function() {
    //   var that = this._getCesiumProvider();
    //   /**
    //    * The view model used to display this terrain provider in the Cesium layer picker widget.
    //    * @type{ProviderViewModel}
    //    */
    //   return new ProviderViewModel({
    //     creationFunction: function() {
    //       terrainManager._enabled = false;
    //       terrainManager._shiftEntitiesForTerrain(entityManger.getFeatures());
    //       return that;
    //     },
    //     iconUrl: '',
    //     name: 'SRTM Terrain',
    //     tooltip: 'Elevation data based on the SRTM dataset'
    //   });
    // },

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

    requestTileGeometry: function() {
      var cp = this._getCesiumProvider();
      var geom = cp.requestTileGeometry.apply(cp, arguments);
      return geom;
    },

    getLevelMaximumGeometricError: function() {
      var cp = this._getCesiumProvider();
      return cp.getLevelMaximumGeometricError.apply(cp, arguments);
    },

    getTileDataAvailable: function() {
      var cp = this._getCesiumProvider();
      return cp.getTileDataAvailable.apply(cp, arguments);
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

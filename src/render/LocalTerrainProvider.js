define([
  'atlas/lib/utility/Class',
  'atlas/lib/utility/Setter',
  'atlas/lib/utility/Types',
  'atlas/lib/Q',
  'atlas/util/AtlasMath',
  'atlas-cesium/render/LocalTerrainData',
  'atlas-cesium/cesium/Source/Core/CesiumTerrainProvider',
  'atlas-cesium/cesium/Source/Core/sampleTerrain',
  'atlas-cesium/cesium/Source/Core/TerrainProvider',
  'atlas-cesium/cesium/Source/Widgets/BaseLayerPicker/ProviderViewModel',
], function(Class, Setter, Types, Q, AtlasMath, LocalTerrainData, CesiumTerrainProvider,
            sampleTerrain, TerrainProvider, ProviderViewModel) {

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
     * The local terrain data.
     *
     * @type {LocalTerrainData}
     * @private
     */
    _localTerrainData: null,

    /**
     * Whether the LocalTerrainProvider actually has Local terrain data. If it does not, it will
     * utilise SRTM elevation data.
     *
     * @type {Boolean}
     * @private
     */
    _hasLocalData: false,

    _init: function(args) {
      args = args || {};
      this._renderManager = Setter.require(args, 'renderManager');
      args.localTerrain.renderManager = args.renderManager;
      args.localTerrain && this.setLocalData(args.localTerrain);

      if (!this.isTrueLocal()) {
        this._initDelegation();
        this._cesiumProvider = this._getCesiumProvider();
      }
    },

    setLocalData: function(data) {
      this._hasLocalData = true;
      this._localTerrainData = new LocalTerrainData(data);
    },

    getLocalData: function() {
      return this._localTerrainData;
    },

    isTrueLocal: function() {
      return this._hasLocalData;
    },

    getTerrainMesh: function() {
      if (!this.isTrueLocal()) {return null;}
      return this._localTerrainData.getMesh();
    },

    // -------------------------------------------
    // LOCAL TERRAIN DATA
    // -------------------------------------------
    setEnabled: function(enable) {
      if (!this.isTrueLocal()) {return;}
      if (enable) {
        this.getTerrainMesh().show();
      } else {
        this.getTerrainMesh().hide();
      }
    },

    /**
     * Given a set of GeoPoints, the current terrain elevation model is queried to determine the
     * terrain elevation at their location.
     * @param {Array.<atlas.model.GeoPoint>} geoPoints - The GeoPoints to query at.
     * @returns {Promise} A promise for an array of terrain elevations.
     */
    sampleTerrain: function(geoPoints) {
      var df = Q.defer();
      if (this.isTrueLocal()) {
        df.resolve(AtlasMath.max(this.getLocalData().sampleTerrain(geoPoints)));
      } else {
        var cartographics = geoPoints.map(this._renderManager.cartographicFromGeoPoint, this);
        sampleTerrain(this._getCesiumProvider(), 14, cartographics).then(
            function(terrainPoints) {
          if (terrainPoints.length === 0) { return 0; }

          df.resolve(AtlasMath.max(terrainPoints.map(function(point) {
            return point.height;
          })));
        });
      }
      return df.promise;
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

    /**
     * Delegates TerrainProvider static and CesiumTerrainProvider instance methods to the relevant
     * object.
     */
    _initDelegation: function() {
      // Delegate TerrainProvider static methods.
      ['getRegularGridIndices', 'getEstimatedLevelZeroGeometricErrorForAHeightmap']
          .forEach(function(method) {
        this[method] = function() {
          TerrainProvider[method].apply(null, arguments);
        };
      }, this);

      // Delegate CesiumTerrainProvider non-static methods.
      var cesiumTerrainProviderMethods = ['requestTileGeometry', 'getLevelMaximumGeometricError',
          'getTileDataAvailable'];
      cesiumTerrainProviderMethods.forEach(function(method) {
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

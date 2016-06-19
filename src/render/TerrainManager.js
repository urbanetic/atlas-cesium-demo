define([
  'atlas/lib/utility/Log',
  'atlas/lib/utility/Types',
  'atlas/lib/Q',
  'atlas/render/TerrainManager',
  'atlas/util/AtlasMath',
  'atlas-cesium/render/LocalTerrainProvider',
  'atlas-cesium/cesium/Source/Core/EllipsoidTerrainProvider',
  'atlas-cesium/cesium/Source/Core/sampleTerrain',
  'atlas-cesium/cesium/Source/Widgets/BaseLayerPicker/ProviderViewModel',
], function(Log, Types, Q, CoreTerrainManager, AtlasMath, LocalTerrainProvider,
            EllipsoidTerrainProvider, sampleTerrain, ProviderViewModel) {

  /**
   * @typedef atlas-cesium.render.TerrainManager
   * @ignore
   */
  var TerrainManager;

  /**
   * The Atlas-Cesium implementation of {@link atlas.render.TerrainManager}.
   *
   * @class atlas-cesium.render.TerrainManager
   * @extends atlas.render.TerrainManager
   */
  TerrainManager = CoreTerrainManager.extend(/** @lends atlas-cesium.render.TerrainManager# */ {

    /**
     * Terrain elevation data provider using Cesium's hosted data.
     *
     * @type {TerrainProvider}
     * @private
     */
    _cesiumProvider: null,

    /**
     * Default terrain elevation data provider. Provides the elevation data for a standard WGS84
     * ellipsoid.
     *
     * @type {TerrainProvider}
     * @private
     */
    _ellipsoidTerrain: null,

    /**
     * Flag that is true if the terrain provider has been set directly via the Cesium layer picker
     * widget and <code>_handleEnabledChange</code> should not change the terrain.
     * This prevents the terrain provider from being set twice and slowing down.
     *
     * @type {Boolean}
     * @private
     */
    _terrainAlreadySet: false,

    /**
     * A map of GeoEntity ID to an object literal specifying the GeoEntity's terrain shift and the
     * (cached) location of that terrain shift, based of the GeoEntity's centroid when it was
     * calculated.
     *
     * @type {Object.<String, Object.<atlas.model.GeoPoint, Number>>}
     * @private
     */
    _entityShifts: null,

    setup: function() {
      this._super();
      this._entityShifts = {};
      this._ellipsoidTerrain = this._getEllipsoidProvider();
      this._setupCesiumTerrainPicker();
    },

    /**
     * Handles an entity being shown.
     *
     * @see {@link atlas.render.TerrainManager#_handleEntityShow}.
     * @private
     */
    _handleEntityShow: function(entity, visible) {
      if (!this.isTerrainEnabled) { return; }

      // Shifting entities on show only occurs if the terrain is enabled.
      // Disabling the terrain "un-shifts" all Entities.
      this._shiftEntityForTerrain(entity);
    },

    _shiftEntitiesForTerrain: function(entities) {
      entities.forEach(this._shiftEntityForTerrain, this);
    },

    /**
     * Shifts the given entity vertically to allow for the terrain elevation at it's location. This
     * handles the shift on both enabling and disabling the terrain.
     *
     * @param {atlas.model.GeoEntity} entity - The GeoEntity to shift.
     */
    _shiftEntityForTerrain: function(entity) {
      var enabled = this.isTerrainEnabled();
      var id = entity.getId();
      var centroid = entity.getCentroid();
      var shift = 0;

      if (!centroid) {
        Log.warn('Tried to shift entity ' + id + ' which does not have a centroid');
        return;
      }

      // Previously calculated shift values are cached. The cache includes the Entities centroid
      // value at the time of calculation. The entity has moved (it's centroid is different), the
      // terrain shift is recalculated.
      var existingShift = this._entityShifts[id];
      if (existingShift && existingShift.centroid.equals(centroid)) {
        shift = existingShift.value;
        this._doShift(entity, shift, enabled);
      } else if (!enabled) {
        // If we somehow get to the point that the terrain is being disabled and an entity exists
        // that has not been shifted (presumably up), we should not shift it down.
        return;
      } else {
        this._getTerrainShift(entity).then(function(shift) {
          if (shift === null) {return;}
          this._entityShifts[id] = {
            centroid: centroid.clone(),
            value: shift
          };
          this._doShift(entity, shift, enabled);
        }.bind(this));
      }
    },

    /**
     * Shifts the given <code>entity</code> by the given <code>shift</code>, depending
     * on whether the terrain is enabled or not.
     *
     * @param {atlas.model.GeoEntity} entity - The GeoEntity to shift.
     * @param {Number} shift The amount to shift the entity up or down, in metres.
     * @param {Boolean} enabled - Whether the terrain is enabled.
     * @private
     */
    _doShift: function(entity, shift, enabled) {
      // TODO(bpstudds): Will we have timing issues with `enabled` because this is called
      // asynchronously?

      // Reverse shift if terrain is being disabled.
      if (!enabled) { shift *= -1; }

      // Apply the shift.
      entity.translate({latitude: 0, longitude: 0, elevation: shift});
      Log.debug('Shifting entity ' + entity.getId() + ' ' + parseFloat(shift) + 'm for terrain.');
    },

    /**
     * Gets the terrain shift, where the shift is the average terrain height at the GeoPoints
     * defining the footprint of the GeoEntity. This value is positive if the terrain is above the
     * <code>0m</code> elevation relative to the current <code>TerrainProvider</code>, and negative
     * if the reverse is true.
     *
     * @param {atlas.model.GeoEntity} entity - The entity to calculate the shift for.
     * @returns {Promise} A promise for the GeoEntity's shift value.
     * @private
     */
    _getTerrainShift: function(entity) {
      var df = Q.defer();
      // Try to establish the footprint vertices, otherwise fall back on the centroid.
      var getGeopoints = entity.getVertices || entity._getFootprintVertices;
      var geoPoints = getGeopoints.bind(entity)();

      if (!geoPoints || geoPoints.length === 0) {
        Log.warn('Tried to retrieve terrain shift for entity ' + entity.getId() + ', which ' +
            'does not have a footprint');
        geoPoints = [entity.getCentroid()];
      }

      this._localTerrain.sampleTerrain(geoPoints).then(function(shift) {
        df.resolve(shift);
      });
      return df.promise;
    },

    /**
     * Handles a change in the terrain status.
     *
     * @see {@link atlas.render.TerrainManager#_handleEnabledChange}.
     * @private
     */
    _handleEnabledChange: function(args) {
      var enabled = this.isTerrainEnabled();
      var scene = this._managers.render.getScene();
      var localProvider = this._getLocalProvider(args);

      if (!this._terrainAlreadySet) {
        if (localProvider.isTrueLocal()) {
          localProvider.setEnabled(enabled);
        } else {
          if (enabled) {
            scene.terrainProvider = localProvider;
          } else {
            scene.terrainProvider = this._getEllipsoidProvider();
          }
        }
      }
      scene.globe.enableLighting = enabled;

      // Next time the terrain may be changed normally
      this._terrainAlreadySet = false;

      // Shift any existing entities.
      this._shiftEntitiesForTerrain(this._managers.entity.getFeatures());
    },

    /**
     * Configures the Cesium layer picker widget.
     */
    _setupCesiumTerrainPicker: function() {
      var baseLayerPicker = this._managers.render._widget.baseLayerPicker;
      // Base layer picker may be inactive depending on options passed to Viewer.
      if (!baseLayerPicker) return;
      var blpViewModels = baseLayerPicker.viewModel;
      var terrainProviderViewModels = [
        this._getEllipsoidProviderViewModel(),
        this._getLocalProviderViewModel()
      ];
      blpViewModels.terrainProviderViewModels = terrainProviderViewModels;
    },

    /**
     * @returns {TerrainProvider} The default Ellipsoid terrain provider.
     * @private
     */
    _getEllipsoidProvider: function() {
      if (!this._ellipsoidTerrain) {
        this._ellipsoidTerrain = new EllipsoidTerrainProvider();
      }
      return this._ellipsoidTerrain;
    },

    /**
     * @returns {TerrainProvider} The Local terrain provider. This terrain provider utilises
     * the SRTM elevation data.
     * @private
     */
    _getLocalProvider: function(args) {
      args = args || {};
      if (!this._localTerrain) {
        args.renderManager = this._managers.render;
        this._localTerrain = new LocalTerrainProvider(args);
      }
      return this._localTerrain;
    },

    /**
     * Manually sets the terrain provider.
     * Calls <code>super.setEnabled</code> for its side affects but sets
     * <code>_terrainAlreadySet</code> to true to prevent the  the terrain provider being reset
     * in <code>_handleEnableChanged</code>
     *
     * @param {Boolean} enable - Whether to enable local terrain.
     * @returns {TerrainProvider} The local terrain provider iff enable is true, otherwise the
     *     ellipsoid terrain provider.
     */
    _manualTerrainToggle: function(enable) {
      this._terrainAlreadySet = true;
      this.setEnabled(enable);
      if (enable) {
        return this._getLocalProvider();
      } else {
        return this._getEllipsoidProvider();
      }
    },

    /**
     * @returns {TerrainProviderViewModel} The Ellipsoid Terrain provider view model to be used in
     * the Cesium layer picker widget.
     */
    _getEllipsoidProviderViewModel: function() {
      var terrainManager = this;
      /**
       * The view model used to display this terrain provider in the Cesium layer picker widget.
       *
       * @type {ProviderViewModel}
       */
      return new ProviderViewModel({
        creationFunction: function() {
          return terrainManager._manualTerrainToggle(false);
        },
        iconUrl: 'atlas-cesium/lib/cesium/Source/Widgets/Images/TerrainProviders/Ellipsoid.png',
        name: 'WGS84 Ellipsoid',
        tooltip: 'Standard WGS84 ellipsoid'
      });
    },

    /**
     * @returns {TerrainProviderViewModel} The Local Terrain provider view model to be used in
     * the Cesium layer picker widget.
     */
    _getLocalProviderViewModel: function() {
      var terrainManager = this;
      /**
       * The view model used to display this terrain provider in the Cesium layer picker widget.
       *
       * @type {ProviderViewModel}
       */
      return new ProviderViewModel({
        creationFunction: function() {
          return terrainManager._manualTerrainToggle(true);
        },
        iconUrl: 'atlas-cesium/lib/cesium/Source/Widgets/Images/TerrainProviders/STK.png',
        name: 'STK Terrain',
        tooltip: 'Elevation data based on the SRTM dataset, provided by STK'
      });
    }

  });

  return TerrainManager;

});

define([
  'atlas/lib/utility/Log',
  'atlas/lib/utility/Types',
  'atlas/render/TerrainManager',
  'atlas/util/AtlasMath',
  'atlas-cesium/cesium/Source/Core/CesiumTerrainProvider',
  'atlas-cesium/cesium/Source/Core/EllipsoidTerrainProvider',
  'atlas-cesium/cesium/Source/Core/sampleTerrain'
], function(Log, Types, CoreTerrainManager, AtlasMath, CesiumTerrainProvider,
            EllipsoidTerrainProvider, sampleTerrain) {

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
     * A map of GeoEntity ID to an object literal specifying the GeoEntity's terrain shift and the
     * (cached) location of that terrain shift, based of the GeoEntity's centroid when it was
     * calculated.
     *
     * @type {Object.<String, Object.<atlas.model.GeoPoint: centroid, Number: value>}
     *
     * @private
     */
    _entityShifts: null,

    _init: function(managers) {
      this._super(managers);
    },

    setup: function() {
      this._super();
      this._entityShifts = {};
    },

    /**
     * Handles an entity being shown.
     *
     * @see {@link atlas.render.TerrainManager#_handleEntityShow}.
     */
    _handleEntityShow: function(entity, visible) {
      if (!this.isTerrainEnabled) { return; }

      // Shifting entities on show only occurs if the terrain is enabled.
      // Disabling the terrain "un-shifts" all Entities.
      this._shiftEntityForTerrain(entity, true);
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
     */
    _doShift: function(entity, shift, enabled) {
      // TODO(bpstudds): Will we have timing issues with `enabled` because this is called
      // asynchronously?

      // Reverse shift if terrain is being disabled.
      if (!enabled) { shift *= -1; }

      // Apply the shift.
      entity.translate({latitude: 0, longitude: 0, elevation: shift});
    },

    /**
     * Gets the terrain shift, where the shift is the average terrain height at the GeoPoints
     * defining the footprint of the GeoEntity. This value is positive if the terrain is above the
     * <code>0m</code> elevation relative to the current <code>TerrainProvider</code>, and negative
     * if the reverse is true.
     *
     * @param {atlas.model.GeoEntity} entity - The entity to calculate the shift for.
     *
     * @returns {Number} The GeoEntitys shift value.
     */
    _getTerrainShift: function(entity) {
      var getGeopoints = entity.getVertices || entity._getFootprintVertices;
      var geoPoints = getGeopoints.bind(entity)();

      if (!geoPoints || geoPoints.length === 0) {
        Log.warn('Tried to retrieve terrain shift for entity ' + entity.getId() + ', which has' +
            'does not have a footprint');
        return 0;
      }

      var cartographics = geoPoints.map(this._managers.render.cartographicFromGeoPoint, this);
      return sampleTerrain(this._cesiumProvider, 14, cartographics).then(function(terrainPoints) {
        Log.debug('Stuff is happening');
        if (terrainPoints.length === 0) { return 0; }

        return AtlasMath.average(terrainPoints.map(function(point) {
          return point.height;
        }));
      });
    },

    /**
     * Handles a change in the terrain status.
     *
     * @see {@link atlas.render.TerrainManager#_handleEnabledChange}.
     */
    _handleEnabledChange: function() {
      var enabled = this.isTerrainEnabled();
      var scene = this._managers.render.getScene();

      if (enabled) {
        scene.terrainProvider = this._getCesiumProvider();
        scene.globe.enableLighting = true;
      } else {
        scene.terrainProvider = this._getEllipsoidProvider();
        scene.globe.enableLighting = false;
      }
      // Shift any existing entities.
      this._managers.entity.getFeatures().forEach(function(entity) {
        this._shiftEntityForTerrain(entity);
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

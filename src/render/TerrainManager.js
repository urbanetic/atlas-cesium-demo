define([
  'atlas/lib/utility/Log',
  'atlas/lib/utility/Types',
  'atlas/render/TerrainManager',
  'atlas-cesium/cesium/Source/Core/CesiumTerrainProvider',
  'atlas-cesium/cesium/Source/Core/EllipsoidTerrainProvider',
  'atlas-cesium/cesium/Source/Core/sampleTerrain'
], function(Log, Types, CoreTerrainManager, CesiumTerrainProvider, EllipsoidTerrainProvider,
            sampleTerrain) {

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
     * A map of GeoEntity ID to the value in metres the Entity has been translated in the vertical
     * axis to account for the terrain height at it's location.
     *
     * @type {Object.<String, Number>}
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

    _handleEntityShow: function(entity, visible) {
      if (!this.isTerrainEnabled) { return; }

      // This function is only called when Terrain is enabled.
      this._shiftEntityForTerrain(entity, true);
    },

    /**
     * Shifts the given entity to allow for the terrain elevation at it's location.
     * @param {atlas.model.GeoEntity} entity - The GeoEntity to shift.
     * @param {Boolean} enabled - Whether terrain has been enabled.
     * @returns {[type]} [description]
     */
    _shiftEntityForTerrain: function(entity, enabled) {
      var id = entity.getId();
      var centroid = entity.getCentroid();
      var shift = 0;

      if (!centroid) {
        Log.warn('Tried to shift entity ' + id + ' which does not have a centroid');
        return;
      }

      var existingShift = this._entityShifts[id];
      if (existingShift && existingShift.centroid.equals(centroid)) {
        shift = existingShift.value;
        this._doShift(entity, shift, enabled);
      } else if (!enabled) {
        // If we somehow get to the point that the terrain is being disabled and an entity exists
        // that is not already shifted (presumably up), we should not shift it down.
        return;
      } else {
        this._getTerrainShift(entity).then(function(shift) {
          this._entityShifts[id] = {
            centroid: centroid.clone(),
            value: shift
          };
          this._doShift(entity, shift, enabled);
          Log.debug('More stuff is happening');
        }.bind(this));
      }
    },

    _doShift: function(entity, shift, enabled) {
      // Reverse shift if terrain is being disabled.
      if (!enabled) { shift *= -1; }
      console.log('Shifting entity ' + entity.getId() + ' by ' + shift);

      // Apply the shift.
      entity.translate({latitude: 0, longitude: 0, elevation: shift});
    },

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

        var sum = terrainPoints.reduce(function(sum, point) {
          return sum + point.height;
        }, 0);
        return sum / terrainPoints.length;
      });
    },

    /**
     * Handles a change in the terrain status.
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

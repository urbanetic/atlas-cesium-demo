define([
  'atlas/lib/utility/Log',
  'atlas/model/GeoPoint',
  'atlas/util/AtlasMath',
  // Cesium imports.
  'atlas-cesium/cesium/Source/Core/Cartographic',
  'atlas-cesium/cesium/Source/Core/requestAnimationFrame',
  'atlas-cesium/cesium/Source/Scene/Imagery',
  'atlas-cesium/cesium/Source/Scene/ImageryState',
  'atlas-cesium/cesium/Source/Widgets/Viewer/Viewer',
  'atlas-cesium/cesium/Source/DynamicScene/CzmlDataSource',
  // Base class
  'atlas/render/RenderManager'
], function(Log, GeoPoint, AtlasMath, Cartographic, requestAnimationFrame, Imagery, ImageryState,
            Viewer, CzmlDataSource, RenderManagerCore) {

  /**
   * @typedef atlas-cesium.render.RenderManager
   * @ignore
   */
  var RenderManager;

  /**
   * @extends atlas.render.RenderManager
   * @alias atlas-cesium.render.RenderManager
   */
  RenderManager = RenderManagerCore.extend({

    /**
     * The underlying viewer widget for Cesium.
     * @type {Viewer}
     */
    _widget: null,

    _init: function(managers) {
      this._super(managers);
      // TODO(aramk) Allow passing arguments for this.
      // TODO(aramk) Add docs for these.
      this._sleepMode = true;
      this._isSleeping = false;
      this._minFps = 1;
      this._maxFps = 60;
      this._delta = 0;
      this._deltaHistorySize = 30;
      this._deltaBinSize = 5;
      this._maxDelta = 100;
      this._fps = this._maxFps;
      this._fpsStats = {};
          this._fpsDelay = 3000;
      this._preventFpsDelay = false;
      this._fpsDelayHandler = null;
      this._loadingImageryCount = 0;
      this._isRendering = true;
    },

    /**
     * Creates and initialises the Cesium viewer widget. Sets which
     * control components are included in the widget.
     * @see {@link http://cesiumjs.org/Cesium/Build/Documentation/Viewer.html}
     * @param {String|HTMLElement} elem - The ID of the DOM element or the element to place the widget
     * in.
     */
    createWidget: function(elem) {
      if (this._widget !== null) {
        return;
      }
      this._imageryShim();
      this._widget = new Viewer(elem, {
        animation: false,
        baseLayerPicker: true,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        timeline: false,
        navigationHelpButton: false,
        useDefaultRenderLoop: false
      });
      this._drawShim();
      this._render();
    },

    /**
     * Monitors when Imagery (image tiles) is being loaded to prevent sleep and avoid slowing down
     * this process.
     * @private
     */
    _imageryShim: function() {
      var that = this;
      var prototype = Imagery.prototype;
      prototype.__defineSetter__('state', function(value) {
        if (value === ImageryState.TRANSITIONING && this._state !== ImageryState.TRANSITIONING) {
          that._loadingImageryCount++;
          that._setSleeping(false);
        } else if (value !== ImageryState.TRANSITIONING &&
            this._state === ImageryState.TRANSITIONING) {
          that._loadingImageryCount--;
          if (that._loadingImageryCount === 0) {
            that._delaySleep(that._fpsDelay);
          }
        }
        this._state = value;
      });
      prototype.__defineGetter__('state', function() {
        return this._state;
      });
    },

    /**
     * Monitors when primitives are being added/removed to prevent sleep and avoid slowing down this
     * process.
     * @private
     */
    _drawShim: function() {
      var primitives = this.getPrimitives();
      var oldAdd = primitives.add,
          oldRemove = primitives.remove,
          delay = 1000;
      primitives.add = function() {
        var results = oldAdd.apply(primitives, arguments);
        this._delaySleep(delay);
        return results;
      }.bind(this);
      primitives.remove = function() {
        var results = oldRemove.apply(primitives, arguments);
        this._delaySleep(delay);
        return results;
      }.bind(this);
    },

    /**
     * A custom render loop. If sleeping, the frame rate is maintained based on the duration of
     * render cycles. If not, it is set to the maximum FPS.
     * @private
     */
    _render: function() {
      var widget = this._widget,
          tick = this._render.bind(this);

      // This is adapted from CesiumWidget.

      if (widget.isDestroyed() || !this._isRendering) {
        widget._renderLoopRunning = false;
        return;
      }
      widget._renderLoopRunning = true;

      var _render = function() {
        widget.resize();
        // Use the time taken for rendering as a measure of the demand and scale the frame rates
        // accordingly.
        var start = new Date().getTime();
        widget.render();
        if (this._sleepMode) {
          var elapsed = this._delta = new Date().getTime() - start;
          this._updateFpsStats(elapsed);
          if (this._isSleeping) {
            this._fps = this._getSleepFps();
          } else {
            this._fps = this._maxFps;
          }
        } else {
          this._isSleeping = false;
          this._fps = this._maxFps
        }
        requestAnimationFrame(tick);
      }.bind(this);

      try {
        if (this._fps >= this._maxFps) {
          // Execute immediately to avoid timing delays.
          requestAnimationFrame(_render);
        } else {
          setTimeout(_render, 1000 / this._fps);
        }
      } catch (e) {
        widget._useDefaultRenderLoop = false;
        widget._renderLoopRunning = false;
        widget._renderLoopError.raiseEvent(widget, e);
        if (widget._showRenderLoopErrors) {
          widget.showErrorPanel('An error occurred while rendering. Rendering has stopped.', e);
          Log.error(e);
        }
      }
    },

    /**
     * Creates statistics on the history of rendered frames. Used to determine the target FPS when
     * sleeping.
     * @param elapsed
     * @private
     */
    _updateFpsStats: function(elapsed) {
      if (elapsed >= this._maxDelta) {
        return;
      }
      var stats = this._fpsStats;

      var existingMin = stats.min,
          existingMax = stats.max;
      stats.min = existingMin !== undefined ? Math.min(existingMin, elapsed) : elapsed;
      stats.max = existingMax !== undefined ? Math.max(existingMax, elapsed) : elapsed;

      // Average last several render durations (delta) to prevent outliers causing jitter.
      var values = this._fpsStats.values = this._fpsStats.values || [];
      values.push(elapsed);
      if (values.length >= this._deltaHistorySize) {
        values.shift();
      }
      var sum = 0;
      values.forEach(function(i) {
        sum += i;
      });
      stats.avg = sum / values.length;

      // Create bins and count the frequency of deltas in each to determine outliers. Outliers are
      // ignored to give a realistic distribution of deltas.
      var binCount = this._maxDelta / this._deltaBinSize;
      if (!stats.bins) {
        stats.bins = [];
        for (var i = 0; i < binCount; i++) {
          stats.bins[i * this._deltaBinSize] = 0;
        }
      }
      var bins = stats.bins,
          roundDelta = elapsed - (elapsed % this._deltaBinSize),
          stride = this._deltaBinSize;
      bins[roundDelta]++;
      // Loop from last bin to second last and compare with previous bin to find outliers.
      // Note that over time when sleeping the bins for smaller deltas will be positively biased,
      // hence we search from the end for outliers.
      stats.outlierMin = stats.min;
      stats.outlierMax = stats.max;
      for (var j = bins.length - 1; j >= stride; j = j - stride) {
        var currBin = bins[j],
            prevBin = bins[j - stride],
            prevPrevBin = bins[j - stride * 2];
        if (prevBin > 0 && prevPrevBin > 0 && prevBin > currBin * 2) {
          stats.outlierMax = j;
          break;
        }
      }
    },

    /**
     * @returns {Number} The FPS to use when sleeping. Calculated based on the average duration of
     * the last few render calls compared to the recorded history of possible durations (minus
     * outliers).
     * @private
     */
    _getSleepFps: function() {
      var stats = this._fpsStats;
      var delta = stats.avg;
      var ratio = (delta - stats.outlierMin) / (stats.outlierMax - stats.outlierMin);
      // Quadratic is for mitigating effect of large outliers and reducing lower FPS.
      var fps = this._minFps + (this._maxFps - this._minFps) * Math.pow(ratio, 2);
      // Snap the FPS to avoid jitter.
      if (fps > this._maxFps) {
        fps = this._maxFps;
      } else if (fps > 30 && this._minFps <= 30 && fps < this._maxFps) {
        fps = 30;
      } else if (fps > 15 && this._minFps <= 15 && fps < 30) {
        fps = 15;
      } else if (fps > 10 && this._minFps <= 10 && fps < 15) {
        fps = 10;
      } else {
        fps = this._minFps;
      }
      return fps;
    },

    /**
     * Delays sleeping for the given milliseconds before enabling it again. If sleeping is already
     * enabled, this does nothing.
     * @param {Number} ms
     * @private
     */
    _delaySleep: function(ms) {
      if (this._preventFpsDelay) {
        return;
      }
      if (ms === undefined) {
        ms = this._fpsDelay;
      }
      this._setSleeping(false);
      this._fpsDelayHandler = setTimeout(function() {
        this._setSleeping(true);
      }.bind(this), ms);
    },

    /**
     * Sets whether sleeping is enabled. If sleeping is delayed, this also clears the timer.
     * @param {Boolean} value
     * @private
     */
    _setSleeping: function(value) {
      if (this._fpsDelayHandler !== null) {
        clearTimeout(this._fpsDelayHandler);
        this._fpsDelayHandler = null;
      }
      this._isSleeping = value;
    },

    setup: function() {
      this.bindEvents();
    },

    /**
     * Registers event handlers with the EventManager.
     */
    bindEvents: function() {
      // Nothing to see here. 'entity/show' now handled by CesiumAtlas.
      this._managers.event.addEventHandler('extern', 'debugMode', function(debug) {
        this.getScene().debugShowFramesPerSecond = debug;
      }.bind(this));

      this._managers.event.addEventHandler('extern', 'sleepMode', function(state) {
        this._sleepMode = state;
        Log.info('RenderManager setting sleep mode', state);
      }.bind(this));

      // TODO(aramk) Capture when the camera is moving instead of these?

      this._managers.event.addEventHandler('intern', 'input/leftdown', function() {
        this._setSleeping(false);
        // Prevents setting FPS mode on during drag.
        this._preventFpsDelay = true;
      }.bind(this));

      this._managers.event.addEventHandler('intern', 'input/leftup', function() {
        this._preventFpsDelay = false;
        this._delaySleep();
      }.bind(this));

      this._managers.event.addEventHandler('intern', 'input/wheel', function() {
        this._delaySleep(this._fpsDelay);
      }.bind(this));
    },

    // -------------------------------------------
    // GETTERS AND SETTERS
    // -------------------------------------------

    // TODO(aramk) A lot of these methods are only in atlas-cesium, but should also be abstract
    // methods in atlas.

    /**
     * @param {Object} screenCoords - Containing "x" and "y" properties as positions relative to the
     * Atlas widget.
     * @returns {Array} IDs of the {@link atlas.model.GeoEntity} objects which exist at the given
     * screen coordinates.
     */
    getAt: function(screenCoords) {
      var pickedPrimitives = this.getScene().drillPick(screenCoords);
      var pickedIds = [];
      pickedPrimitives.forEach(function(p) {
        pickedIds.push(p.id);
      });
      return pickedIds;
    },

    /**
     * Returns the minimum terrain height, given currently configured terrain options, for
     * an array of Vertices.
     * @param {Array.<atlas.model.Vertex>} vertices - The Vertices to determine minimum terrain height of.
     * @returns {Number} The minimum terrain height.
     */
    getMinimumTerrainHeight: function(vertices) {
      // TODO(bpstudds): Actually calculate the minimum terrain height.
      if (vertices || !vertices) {
        // Using vertices to make IDE warning go away.
      }
      return 0;
    },

    geoPointFromScreenCoords: function(screenCoords) {
      var cartesian = this.getCesiumCamera().pickEllipsoid(screenCoords);
      if (!cartesian) {
        return null;
      }
      var cartographic = this.getEllipsoid().cartesianToCartographic(cartesian);
      return GeoPoint.fromRadians(cartographic);
    },

    convertScreenCoordsToLatLng: function(screenCoords) {
      // TODO(bpstudds): Delete this function as it duplicates geoPointFromScreenCoords.
      var cartesian = this.getCesiumCamera().pickEllipsoid(screenCoords);
      if (!cartesian) {
        return null;
      }
      var cartographic = this.getEllipsoid().cartesianToCartographic(cartesian);
      return GeoPoint.fromRadians(cartographic);
    },

    /**
     * Converts a Vertex representing a geographic position and converts it to a
     * Cesium Cartestian3 object.
     * @param {atlas.model.Vertex} cart - The vertex.
     * @param {Number} cart.x - The longitude in decimal degrees.
     * @param {Number} cart.y - The latitude in decimal degrees.
     * @param {Number} cart.z - The elevation in metres.
     * @returns {Cartesian3}
     */
    cartesianFromVertex: function(cart) {
      var ellipsoid = this.getEllipsoid(),
          cesiumCart = new Cartographic(cart.x, cart.y, cart.z);

      return ellipsoid.cartographicToCartesian(cesiumCart);
    },

    cartesianArrayFromVertexArray: function(vertices) {
      var cartographics = [],
          ellipsoid = this.getEllipsoid();
      for (var i = 0; i < vertices.length; i++) {
        cartographics.push(Cartographic.fromDegrees(
                /*longitude*/ vertices[i].x,
                /*latitude*/  vertices[i].y)
        );
      }
      return ellipsoid.cartographicArrayToCartesianArray(cartographics);
    },

    /**
     * Converts a GeoPoint to a Cesium Cartestian3 object.
     * @param {atlas.model.GeoPoint} cart - The geographic position.
     * @returns {Cartesian3}
     */
    cartesianFromGeoPoint: function(cart) {
      var radCart = cart.toRadians(),
          ellipsoid = this.getEllipsoid(),
          cesiumCart = new Cartographic(radCart.longitude, radCart.latitude, radCart.elevation);

      return ellipsoid.cartographicToCartesian(cesiumCart);
    },

    /**
     * Converts an array of Atlas GeoPoints to Cesium Cartesian3 objects.
     * @param {Array.<atlas.model.GeoPoint>} geopoints - Array of GeoPoints
     * @returns {Array.<Cartesian3>} An array of Cesium Cartesian3 objects.
     */
    cartesianArrayFromGeoPointArray: function(geopoints) {
      return this.cartesianArrayFromVertexArray(geopoints.map(function(geoPoint) {
        return geoPoint.toVertex();
      }));
    },

    /**
     * Converts a cartesian coordinate to a cartographic location on the rendered globe.
     * @param cartesian The cartesian coordinates.
     * @returns {atlas.model.GeoPoint}
     */
    // TODO(aramk) This should be in GeoPoint since it has nothing to do with rendering (we're just
    // using the ellipsoid).
    geoPointFromCartesian: function(cartesian) {
      var cesiumCartographic = this.getEllipsoid().cartesianToCartographic(cartesian);
      return GeoPoint.fromRadians(cesiumCartographic);
    },

    // TODO(aramk) This is used to encapsulate CzmlDataSource within atlas-cesium. Eventually we may
    // want to add this to RenderManager in Atlas if we depend on czml outside Cesium.
    createCzmlDataSource: function(czml) {
      var dataSource = new CzmlDataSource();
      dataSource.load(czml, 'Built-in CZML');
      return dataSource;
    },

    getCesiumCamera: function() {
      return this._widget.scene.camera;
    },

    getCameraController: function() {
      return this._widget.scene.screenSpaceCameraController;
    },

    getPrimitives: function() {
      return this._widget.scene.primitives;
    },

    getEllipsoid: function() {
      return this.getScene().globe.ellipsoid;
    },

    getScene: function() {
      return this._widget.scene;
    }

  });

  return RenderManager;
});

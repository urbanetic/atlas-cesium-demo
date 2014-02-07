/*
 * The Cesium implementation of the atlas RenderManager
 */
define([
  'atlas/util/Extends',
  'atlas/model/Vertex',
  'atlas-cesium/model/Feature',
  // Cesium imports.
  'atlas-cesium/cesium/Source/Widgets/Viewer/Viewer',
  'atlas-cesium/cesium/Source/Scene/PerformanceDisplay',
  'atlas-cesium/cesium/Source/Core/requestAnimationFrame',
  'atlas-cesium/cesium/Source/Scene/Imagery',
  'atlas-cesium/cesium/Source/Scene/ImageryLayer',
  'atlas-cesium/cesium/Source/Scene/TileProviderError',
  'atlas-cesium/cesium/Source/Scene/ImageryState',
  'atlas-cesium/cesium/Source/ThirdParty/when',
  'atlas-cesium/cesium/Source/Core/defined',
  // Base class
  'atlas/render/RenderManager'
], function(extend, Vertex, Feature, CesiumViewer, PerformanceDisplay, requestAnimationFrame,
            Imagery, ImageryLayer, TileProviderError, ImageryState, when, defined,
            RenderManagerCore) {
  "use strict";

  /**
   * Responsible for global rendering control specific to Cesium.
   *
   * @param {Object} atlasManagers - A map of manager types to Atlas manager objects.
   * @returns {atlas-cesium.render.RenderManager}
   *
   * @extends {atlas.render.RenderManager}
   * @alias atlas-cesium.render.RenderManager
   * @constructor
   */
  var RenderManager = function(atlasManagers) {
    /*=====
     Inherited from RenderManagerCore
     this._atlasManagers;
     =====*/
    RenderManager.base.constructor.call(this, atlasManagers);

    this._widget = null;
    this._performanceDisplay = null;
    // TODO(aramk) Allow passing arguments for this.
    this._fpsMode = false;
    this._minFPS = 1;
    this._maxFPS = 60;
    this._delta = 0;
    this._deltaHistorySize = 30;
    // TODO(aramk) Make this more intelligent.
    this._fpsInitialDelay = 50;
    this._deltaBinSize = 5;
    this._maxDelta = 50;
    this._fpsStatsCountLimit = 1000;
    this._fps = this._maxFPS;
    this._fpsStats = {};
    this._fpsDelay = 3000;
    this._preventFpsDelay = false;
    this._fpsDelayHandler = null;
    this._loadingImageryCount = 0;
    this._isRendering = true;
  };
  extend(RenderManagerCore, RenderManager);

  /**
   * Creates and initialises the Cesium viewer widget. Sets which
   * control components are included in the widget.
   * @see {@link http://cesiumjs.org/Cesium/Build/Documentation/Viewer.html}
   * @param {String} elem - The ID of the DOM element to place the widget in.
   */
  RenderManager.prototype.createWidget = function(elem) {
    if (this._widget !== null) {
      return;
    }
    this._shim();
    this._widget = new CesiumViewer(elem, {
      animation: false,
      baseLayerPicker: true,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      timeline: false,
      useDefaultRenderLoop: false
    });
    this._render();

    this._atlasManagers.event.addEventHandler('intern', 'input/leftdown', function() {
      this._setFpsMode(false);
      // Prevents setting FPS mode on during drag.
      this._preventFpsDelay = true;
    }.bind(this));

    this._atlasManagers.event.addEventHandler('intern', 'input/leftup', function() {
      this._preventFpsDelay = false;
      this._delayFpsMode(this._fpsDelay);
    }.bind(this));

    this._atlasManagers.event.addEventHandler('intern', 'input/wheel', function() {
      this._delayFpsMode(this._fpsDelay);
    }.bind(this));

  };

  // TODO(aramk) Move this into a file under "shims" folder. Eventually handle this with custom events?
  RenderManager.prototype._shim = function() {
    var that = this;
    var prototype = Imagery.prototype;
    prototype.__defineSetter__('state', function(value) {
      if (value === ImageryState.TRANSITIONING && this._state !== ImageryState.TRANSITIONING) {
        that._loadingImageryCount++;
        that._setFpsMode(false);
      } else if (value !== ImageryState.TRANSITIONING &&
          this._state === ImageryState.TRANSITIONING) {
        that._loadingImageryCount--;
        if (that._loadingImageryCount === 0) {
          that._delayFpsMode(this._fpsDelay);
        }
      }
      this._state = value;
    });
    prototype.__defineGetter__('state', function() {
      return this._state;
    });
  };

  RenderManager.prototype._render = function() {
    var widget = this._widget,
        tick = this._render.bind(this);

    // This is adapted from CesiumWidget.

    if (widget.isDestroyed() || !this._isRendering) {
//      console.debug('Not rendering', widget.isDestroyed(), !this._isRendering);
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
      var elapsed = new Date().getTime() - start;
      if (this._fpsMode) {
        this._updateFpsStats(elapsed);
        this._fps = this._getTargetFps(elapsed);
      } else {
        this._fps = this._maxFPS;
      }
      this._delta = elapsed;
//      console.debug('this._fpsStats', this._fpsStats, 'elapsed', elapsed, 'fps', this._fps, 'avg',
//          this._fpsStats.avg);
      requestAnimationFrame(tick);
    }.bind(this);

    try {
      if (this._fps === this._maxFPS) {
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
        widget.showErrorPanel('An error occurred while rendering.  Rendering has stopped.', e);
        console.error(e);
      }
    }
  };

  RenderManager.prototype._updateFpsStats = function(elapsed) {
    if (elapsed >= this._maxDelta) {
      return;
    }
    var stats = this._fpsStats;

    stats.frameCount = stats.frameCount || 0;
    if (stats.frameCount > this._fpsStatsCountLimit) {
      return;
    }
    stats.frameCount++;

    var existingMin = stats.min,
        existingMax = stats.max;
    stats.min = existingMin !== undefined ? Math.min(existingMin, elapsed) : elapsed;
    stats.max = existingMax !== undefined ? Math.max(existingMax, elapsed) : elapsed;

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

    var binCount = this._maxDelta / this._deltaBinSize;
    if (!stats.bins) {
      stats.bins = [];
      for (var i = 0; i < binCount; i++) {
        stats.bins[i * this._deltaBinSize] = 0;
      }
    }
    var bins = stats.bins,
        roundDelta = elapsed - (elapsed % this._deltaBinSize);
    bins[roundDelta]++;

    // Loop from last bin to second last and compare with previous bin to find outliers.
    var stride = this._deltaBinSize;

    stats.outlierMin = stats.min;
    stats.outlierMax = stats.max;
//    var sum = 0;
//    for (var k = 0; k < bins.length - stride; k = k + stride) {
//      sum += bins[k];
//      if (sum >= 0.95 * stats.frameCount) {
//        stats.outlierMax = k + stride;
//        break;
//      }
//    }
    for (var j = bins.length - 1; j >= stride; j = j - stride) {
      var currBin = bins[j],
          prevBin = bins[j - stride],
          prevPrevBin = bins[j - stride * 2];
      if (prevBin > 0 && prevPrevBin > 0 && prevBin > currBin * 2) {
        stats.outlierMax = j;
        break;
      }
    }
  };

  RenderManager.prototype._getTargetFps = function(elapsed) {
    var stats = this._fpsStats;
    if (stats.frameCount < this._fpsInitialDelay) {
      return this._maxFPS;
    }
    var delta = stats.avg;
    var ratio = (delta - stats.outlierMin) / (stats.outlierMax - stats.outlierMin);

//    var yRatio = Math.sqrt(1 - Math.pow(ratio - 1, 2));
//    console.debug('ratio', ratio, 'yRatio', yRatio);

    // TODO(aramk) remove
//    return 1;

    // TODO(aramk) Don't hard code these.
    var fps = this._minFPS + (this._maxFPS - this._minFPS) * Math.pow(ratio, 2);
//    console.debug('real', fps, 'ratio', ratio);
    if (fps > 60) {
      fps = 60;
    } else if (fps > 30 && fps < 60) {
      fps = 30;
    } else if (fps > 15 && fps < 30) {
      fps = 15;
    } else if (fps > 10 && fps < 15) {
      fps = 10;
    } else {
      fps = 1;
    }
    return fps;
  };

  RenderManager.prototype._delayFpsMode = function(ms) {
    if (this._preventFpsDelay) {
      return;
    }
    this._setFpsMode(false);
    this._fpsDelayHandler = setTimeout(function() {
      this._setFpsMode(true);
    }.bind(this), ms);
  };

  RenderManager.prototype._setFpsMode = function(value) {
    if (this._fpsDelayHandler) {
      clearTimeout(this._fpsDelayHandler);
      this._fpsDelayHandler = null;
      console.error('this._fpsMode clear');
    }
    this._fpsMode = value;
  };

  RenderManager.prototype.setup = function() {
    this.bindEvents();
  };

  /**
   * Registers event handlers with the EventManager.
   */
  RenderManager.prototype.bindEvents = function() {
    // Nothing to see here. 'entity/show' now handled by CesiumAtlas.
    this._atlasManagers.event.addEventHandler('extern', 'debugMode', function(debug) {
      if (debug) {
        this._performanceDisplay = this._performanceDisplay || new PerformanceDisplay();
        this._widget.scene.getPrimitives().add(this._performanceDisplay);
      } else if (this._performanceDisplay) {
        this._widget.scene.getPrimitives().remove(this._performanceDisplay);
      }
    }.bind(this));
  };

  // -------------------------------------------
  // GETTERS AND SETTERS
  // -------------------------------------------

  RenderManager.prototype.getAt = function(screenCoords) {
    var pickedPrimitives = this._widget.scene.drillPick(screenCoords);
    var pickedIds = [];
    pickedPrimitives.forEach(function(p) {
      pickedIds.push(p.id);
    });
    return pickedIds;
  };

  RenderManager.prototype.getAnimations = function() {
    return this._widget.scene.getAnimations();
  };

  RenderManager.prototype.getCesiumCamera = function() {
    return this._widget.scene.getCamera();
  };

  /**
   * Returns the minimum terrain height, given currently configured terrain options, for
   * an array of Vertices.
   * @param {Array.<atlas.model.Vertex>} vertices - The Vertices to determine minimum terrain height of.
   * @returns {Number} The minimum terrain height.
   */
  RenderManager.prototype.getMinimumTerrainHeight = function(vertices) {
    // TODO(bpstudds): Actually calculate the minimum terrain height.
    if (vertices || !vertices) {
      // Using vertices to make IDE warning go away.
    }
    return 0;
  };

  RenderManager.prototype.convertScreenCoordsToLatLng = function(screenCoords) {
    var cartesian = this._widget.scene.getCamera().controller.pickEllipsoid(screenCoords);
    var cartographic = this._widget.centralBody.getEllipsoid().cartesianToCartographic(cartesian);
    var f = 180 / Math.PI;
    return new Vertex(f * cartographic.latitude, f * cartographic.longitude, cartographic.height);
  };

  return RenderManager;
});


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
  // Base class
  'atlas/render/RenderManager'
], function(extend, Vertex, Feature, CesiumViewer, PerformanceDisplay, requestAnimationFrame,
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
    this._fps = 60;
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
  };

  RenderManager.prototype._render = function() {
    var widget = this._widget,
        tick = this._render.bind(this);

    // This is adapted from CesiumWidget.

    if (widget.isDestroyed() || !this._isRendering) {
      console.debug('Not rendering', widget.isDestroyed(), !this._isRendering);
      widget._renderLoopRunning = false;
      return;
    }

    widget._renderLoopRunning = true;
    try {
      setTimeout(function() {
        widget.resize();
//        console.time("render");
        widget.render();
//        console.timeEnd("render");
        requestAnimationFrame(tick);
      }, 1000 / this._fps);
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


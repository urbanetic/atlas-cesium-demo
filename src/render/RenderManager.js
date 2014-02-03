/*
 * The Cesium implementation of the atlas RenderManager
 */
define([
  'atlas/util/Extends',
  'atlas/model/Vertex',
  'atlas-cesium/model/Feature',
  // Cesium imports.
  'atlas-cesium/cesium/Source/Widgets/Viewer/Viewer',
  // Base class
  'atlas/render/RenderManager'
], function (extend, Vertex, Feature, CesiumViewer, RenderManagerCore) {
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
  var RenderManager = function (atlasManagers) {
    /*=====
    Inherited from RenderManagerCore
    this._atlasManagers;
    =====*/
    RenderManager.base.constructor.call(this, atlasManagers);

    this._widget = null;
  };
  extend(RenderManagerCore, RenderManager);

  /**
   * Creates and initialises the Cesium viewer widget. Sets which
   * control components are included in the widget.
   * @see {@link http://cesiumjs.org/Cesium/Build/Documentation/Viewer.html}
   * @param {String} elem - The ID of the DOM element to place the widget in.
   */
  RenderManager.prototype.createWidget = function (elem) {
    if (this._widget !== null) {
      return;
    }
    this._widget = new CesiumViewer(elem, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      timeline: false
    });
  };

  /**
   * Registers event handlers with the EventManager.
   */
  RenderManager.prototype.bindEvents = function () {
    // Nothing to see here. 'entity/show' now handled by CesiumAtlas.
  };

//////
// GETTERS AND SETTERS

  RenderManager.prototype.getAt = function (screenCoords) {
    var pickedPrimitives = this._widget.scene.drillPick(screenCoords);
    var pickedIds = [];
    pickedPrimitives.forEach(function (p) {
      pickedIds.push(p.id);
    });
    return pickedIds;
  };

  RenderManager.prototype.getAnimations = function () {
    return this._widget.scene.getAnimations();
  };

  RenderManager.prototype.getCesiumCamera = function () {
    return this._widget.scene.getCamera();
  };

  /**
   * Returns the minimum terrain height, given currently configured terrain options, for
   * an array of Vertices.
   * @param {Array.<atlas.model.Vertex>} vertices - The Vertices to determine minimum terrain height of.
   * @returns {Number} The minimum terrain height.
   */
  RenderManager.prototype.getMinimumTerrainHeight = function (vertices) {
    // TODO(bpstudds): Actually calculate the minimum terrain height.
    if (vertices || !vertices) {
      // Using vertices to make IDE warning go away.
    }
    return 0;
  };

  RenderManager.prototype.convertScreenCoordsToLatLng = function (screenCoords) {
    var cartesian = this._widget.scene.getCamera().controller.pickEllipsoid(screenCoords);
    var cartographic = this._widget.centralBody.getEllipsoid().cartesianToCartographic(cartesian);
    var f = 180 / Math.PI;
    return new Vertex(f * cartographic.latitude, f * cartographic.longitude, cartographic.height);
  };

  return RenderManager;
});


/*
 * The Cesium implementation of the atlas RenderManager
 */
define([
  'atlas/util/Extends',
  'atlas-cesium/model/Feature',
  // Cesium imports.
  'atlas-cesium/cesium/Source/Widgets/Viewer/Viewer',
  // Base class
  'atlas/render/RenderManager'
], function (extend, Feature, CesiumViewer, RenderManagerCore) {
  "use strict";

  /**
   * Responsible for global rendering control specific to Cesium.
   *
   * @params {Object} atlasManagers - A map of manager types to Atlas manager objects.
   * @returns {atlas-cesium/render/RenderManager}
   * 
   * @extends {atlas/render/RenderManager}
   * @alias atlas-cesium/render/RenderManager
   * @constructor
   */
  var RenderManager = function (atlasManagers) {
    /*=====
    Inherited from RenderManagerCore
    this._entities;
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
    console.debug('in renderManager', 'binding events');
    var handlers = [
      { // Define an event handler for showing an entity.
        source: 'extern',
        name: 'entity/show',
        callback: function (event, args) {
          if (!(args.id in this._entities)) {
            this.addFeature(args.id, args);
          }
          this._entities[args.id].show();
        }.bind(this)
      },
      { // Define an event handler for hiding an entity.
        source: 'extern',
        name: 'entity/hide',
        callback: function (event, args) {
          if (!(args.id in this._entities)) {
            this._entities[args.id].hide();
          }
        }.bind(this)
      }
    ];
    // Add the event handlers to the EventManager.
    this._atlasManagers.event.addEventHandlers(handlers);
  };

  /**
   * Returns the minimum terrain height, given currently configured terrain options, for
   * an array of Vertices.
   * @param {Array.<atlas/model/Vertex>} vertices - The Vertices to determine minimum terrain height of.
   * @returns {Number} The minimum terrain height.
   */
  RenderManager.prototype.getMinimumTerrainHeight = function (vertices) {
    // TODO(bpstudds): Actually calculate the minimum terrain height.
    return 0;
  };

  /**
   * Convenience function that creates a new Feature and adds it to the RenderManager.
   *   
   * @param {Number} id - The ID of this Feature.
   * @param {Object} args - Parameters describing the feature.
   * @param {atlas/render/RenderManager} args.renderManager - The RenderManager object responsible for rendering the Feature.
   * @param {atlas/events/EventManager} args.eventManager - The EventManager object responsible for the event system.
   * @param {String|Array.atlas/model/Vertex} [args.footprint=null] - Either a WKT string or array of Vertices describing the footprint polygon.
   * @param {atlas/model/Mesh} [args.mesh=null] - The Mesh object for the Feature.
   * @param {Number} [args.height=0] - The extruded height when displaying as a extruded polygon.
   * @param {Number} [args.elevation=0] - The elevation (from the terrain surface) to the base of the Mesh or Polygon.
   * @param {Boolean} [args.show=false] - Whether the feature should be initially shown when created.
   * @param {String} [args.displayMode='footprint'] - Initial display mode of feature, one of 'footprint', 'extrusion' or 'mesh'.
   */ 
  RenderManager.prototype.addFeature = function (id, args) {
    if (id === undefined) {
      throw new DeveloperError('Can not add Feature without specifying id');
    } else {
      // Add EventManger to the args for the feature.
      args.eventManager = this._atlasManagers.event;
      // Add the RenderManager to the args for the feature.
      args.renderManager = this;
      var feature = new Feature(id, args);
      console.debug('cesium-atlas adding feature', args.id, feature);
      this.addEntity(feature);
    }
  };

  /**
   * Shows a given Entity.
   * @param {String} id - The ID of the entity to be shown.
   */
  RenderManager.prototype.show = function (id) {
    if (id in this._entities) {
      console.debug('showing', id);
      this._entities[id].show();
    }
  };

  /**
   * Hides a given Entity.
   * @param {String} id - The ID of the entity to be hidden.
   */
  RenderManager.prototype.hide = function (id) {
    if (id in this._entities) {
      console.debug('hiding', id);
      this._entities[id].hide();
    }
  };

  return RenderManager;
});
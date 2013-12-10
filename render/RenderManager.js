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

  RenderManager.prototype.getMinimumTerrainHeight = function (vertices) {
    // TODO(bpstudds): Actually calculate the minimum terrain height.
    return 0;
  };

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

  RenderManager.prototype.show = function (id) {
    if (id in this._entities) {
      console.log('in RenderManager', 'showing', this._entities[id]);
      this._entities[id].show();
    }
  };

  RenderManager.prototype.hide = function (id) {
    if (id in this._entities) {
      this._entities[id].hide();
    }
  };

  return RenderManager;
});
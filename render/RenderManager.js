/*
 * The Cesium implementation of the atlas RenderManager
 */
define([
  'atlas/util/Extends',
  'atlas/render/RenderManager',
  'atlas-cesium/cesium/Widgets/Viewer/Viewer',
  'atlas-cesium/cesium/Scene/Primitive'
], function (extend, RenderManagerCore, CesiumViewer, Primitive) {
  "use strict";

  /**
   * 
   * @extends {atlas/render/RenderManager}
   * @alias atlas-cesium/render/RenderManager
   * @constructor
   */
  var RenderManager = function () {
    /*=====
    Inherited from RenderManagerCore
    this.entities
    =====*/
    RenderManager.base.constructor.call(this);

    this._widget = null;
  };
  extend(RenderManagerCore, RenderManager);

  RenderManager.prototype.createWidget = function (elem) {
    if (this._widget !== null) {
      return;
    }
    this._widget = new CesiumViewer(elem, {
      animation: false,
      fullscreenButton: false,
      homeButton: false,
      timeline: false
    });
  };

  RenderManager.prototype.show = function (id) {
    if (typeof this._entities[id] === 'undefined') {
      console.debug('entity #' + id + ' does not exist');
    } else {
      if (this._entities[id].isVisible() && this._entities[id].isRenderable()) {
        console.debug('entity ' + id + ' already visible and correctly rendered');
      } else {
        console.log('showing entity', this._entities[id]);
        if (this._entities[id].isRenderable()) {
          // If the Cesium primitive is already created, set it to be shown...
          this._entities[id].primitive.show = true;
        } else {
          // otherwise, need to create and show primitive.
          this._createPrimitive(id);
          this._widget.scene.getPrimitives().add(this._entities[id].primitive);
          this._entities[id]._visible = true;
        }
      }
    }
  };

  RenderManager.prototype.hide = function (id) {
    if (this._entities[id] !== undefined) {
      if (this._entities[id].isVisisble) {
        if (this._entities[id].primitive) {
          this._entities[id]._visible = false;
          this._entities[id].primitive.show = false;
        }
      }
    }
  };

  RenderManager.prototype._createPrimitive = function (id) {
    // TODO(bpstudds): Enable many terrain heights, we only have one currently.
    if (!this._entities[id].isRenderable()) {
      this._entities[id].build(this._widget.centralBody.getEllipsoid(),
          /*miniumumTerrainElevation*/ 0);
    }
    var geometry = this._entities[id].getGeometry();
    var appearance = this._entities[id].getAppearance();
    this._entities[id].primitive =
        new Primitive({geometryInstances: geometry, appearance: appearance});
  };


  return RenderManager;
});
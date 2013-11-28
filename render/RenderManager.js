/*
 * The Cesium implementation of the atlas RenderManager
 */
define([
  'atlas/util/Extends',
  'atlas/render/RenderManager',
  'atlas-cesium/cesium/Widgets/Viewer/Viewer'
], function (extend, RenderManagerCore, CesiumViewer) {

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
    if (this._entities[id] !== undefined) {
      if (!this._entities[id].isVisible) {
        if (this._entities[id].primitive) {
          // If the Cesium primitive is already created, set it to be shown...
          this._entities[id].primitive.show = true;
        } else {
          // otherwise, need to create and show primitive.
          this.entites[id].primitive = this._createPrimitive(id);
          this._widget.scene.getPrimitives().add(this.entites[id].primitive);
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
    if (!this.entities[id].isRenderable) {
      this.entities[id].build(this._widget.centralBody.getEllipsoid(),
          /*miniumumTerrainElevation*/ 0);
    }
    geometry = this.entities[id].getGeometry;
    appearance = this.entities[id].getAppearance;
    this.entites[id].primitive = 
        new Primitive({geometryInstances: geometry, appearance: appearance});
  };


  return RenderManager;
});
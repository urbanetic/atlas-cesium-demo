define([
  'atlas/model/Handle',
  'atlas/util/Paths',
  'atlas-cesium/cesium/Source/Core/Cartesian3'
], function(HandleCore, Paths, Cartesian3) {

  /**
   * @typedef atlas-cesium.model.Handle
   * @ignore
   */
  var Handle;

  /**
   * @class atlas-cesium.model.Handle
   * @extends atlas.model.Handle
   */
  Handle = HandleCore.extend(/** @lends atlas.model.Handle# */ {

    _billboard: null,

    _build: function() {
      var renderManager = this._renderManager;
      var billboards = renderManager.getBillboards();
      var position = renderManager.cartesianFromGeoPoint(this.getTarget());
      var eyeOffset = new Cartesian3(0, this.getElevation(), 0);
      if (this.isDirty('model') || this.isDirty('entity')) {
        // this._billboard && billboards.remove(this._billboard);
        if (this._billboard) {
          this._billboard.position = position;
          this._billboard.eyeOffset = eyeOffset;
        } else {
          this._billboard = billboards.add({
            id: this.getId(),
            image: Paths.getInstance().getResourceDirectory() + 'images/handle.png',
            eyeOffset: eyeOffset,
            position: position
          });
        }
      }
    },

    remove: function() {
      this._super();
      var billboards = this._renderManager.getBillboards();
      billboards.remove(this._billboard);
    },

    _updateVisibility: function(visible) {
      if (this._billboard) this._billboard.show = visible;
    }

  });

  return Handle;
});

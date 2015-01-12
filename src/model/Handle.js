define([
  'atlas/model/Handle',
  'atlas/util/Paths',
  'atlas-cesium/cesium/Source/Scene/BillboardCollection',
  'atlas-cesium/cesium/Source/Core/Cartesian3'
], function(HandleCore, Paths, BillboardCollection, Cartesian3) {

  /**
   * @typedef atlas-cesium.model.Handle
   * @ignore
   */
  var Handle;

  /**
   * A global {@link BillboardCollection} for all {@link atlas.model.Handle} objects.
   * @type {BillboardCollection}
   */
  // TODO(aramk) Store handle collection per entity? See http://cesiumjs.org/Cesium/Build/Documentation/BillboardCollection.html?classFilter=billbo
  var billboards;

  /**
   * @classdesc This class extends the Atlas Handle class so it can be rendered
   * using cesium.
   *
   * @class atlas-cesium.model.Handle
   * @extends atlas.model.Handle
   */
  Handle = HandleCore.extend(/** @lends atlas.model.Handle# */ {

    _billboard: null,

    _build: function() {
      var renderManager = this._renderManager;
      var billboards = this._getBillboards();
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
      var billboards = this._getBillboards();
      billboards.remove(this._billboard);
    },

    _getBillboards: function() {
      if (!billboards) {
        var renderManager = this._renderManager;
        var primitives = renderManager.getPrimitives();
        billboards = new BillboardCollection();
        primitives.add(billboards);
      }
      return billboards;
    },

    _updateVisibility: function(visible) {
      if (this._billboard) this._billboard.show = visible;
    }

  });

  return Handle;
});

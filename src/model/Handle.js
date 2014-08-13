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
      if (this.isDirty('model')) {
        if (this._billboard) {
          this._billboard.position = renderManager.cartesianFromGeoPoint(this.getTarget());
        } else {
          this._billboard = billboards.add({
            id: this.getId(),
            image: Paths.getInstance().getResourceDirectory() + 'images/handle.png',
            eyeOffset: new Cartesian3(0, 1, 0),
            position: position
          });
        }
      }
      this._super();
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

    show: function() {
      if (!this.isRenderable()) {
        this._build();
      }
      return this._billboard.show = true;
    },

    hide: function() {
      return this._billboard.show = false;
    }

  });

  return Handle;
});

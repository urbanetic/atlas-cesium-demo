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
   * A global {@link BillboardCollection} for all handles.
   * @type {BillboardCollection}
   */
  // TODO(aramk) Store handle collection per entity? See cesium docs for pros/cons.
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
      var billboards = this._getBillboardCollection();
      var target = this._target.clone();
      target.elevation = 0;
      var position = renderManager.cartesianFromGeoPoint(target);
      var screenCoords = renderManager.screenCoordsFromGeoPoint(target);
      this._billboard = billboards.add({
        id: this.getId(),
        image: Paths.getInstance().getResourceDirectory() + 'images/handle.png',
        eyeOffset: new Cartesian3(0, 1, 0),
        position: position
      });
    },

    remove: function() {
      this._super();
      var billboards = this._getBillboardCollection();
      billboards.remove(this._billboard);
    },

    _getBillboardCollection: function() {
      if (!billboards) {
        var renderManager = this._renderManager;
        var primitives = renderManager.getPrimitives();
        billboards = new BillboardCollection();
        primitives.add(billboards);
      }
      return billboards;
    },

    show: function() {
      return this._billboard.show = true;
    },

    hide: function() {
      return this._billboard.show = false;
    },

    translate: function(translation) {
      this._super.apply(this, arguments);
      var renderManager = this._renderManager;
      this._billboard.position = renderManager.cartesianFromGeoPoint(this.getTarget());
    }

  });

  return Handle;
});

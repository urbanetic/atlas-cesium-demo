define([
  'atlas/model/GeoPoint',
  'atlas-cesium/model/Ellipse',
  'atlas-cesium/cesium/Source/Scene/BillboardCollection',
  'atlas-cesium/cesium/Source/Core/Cartesian2',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
  // Base class.
  'atlas/model/Handle'
], function(GeoPoint, Ellipse, BillboardCollection, Cartesian2, Cartesian3, HandleCore) {

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
      var screenCoords = renderManager.geoPointToScreenCoords(target);
      this._billboard = billboards.add({
        id: this.getId(),
        // TODO(aramk) Give relative URL or base64.
        image: 'http://localhost/urbanetic/atlas-cesium-demo/atlas/resources/images/handle.png',
        // Position the handle above the ground so it doesn't intersect the owner's visualisation.
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
      var startPoint = renderManager.geoPointFromCartesian(this._billboard.position);
      var endPoint = startPoint.translate(translation);
      this._billboard.position = renderManager.cartesianFromGeoPoint(endPoint);
    }

  });

  return Handle;
});

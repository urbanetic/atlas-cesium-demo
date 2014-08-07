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
   * @classdesc This class extends the Atlas Handle class so it can be rendered
   * using cesium.
   *
   * @class atlas-cesium.model.Handle
   * @extends atlas.model.Handle
   */
  Handle = HandleCore.extend(/** @lends atlas.model.Handle# */ {

    // TODO(aramk) Store billboard collection on the owner.

    _dot: null,

    _createDot: function(args) {
      //return new Ellipse(this.getId(), {centroid: this._target, semiMajor: this._dotRadius}, args);
      var renderManager = this._renderManager;
      var primitives = renderManager.getPrimitives();
      var billboards = primitives.add(new BillboardCollection());
      var position = renderManager.cartesianFromGeoPoint(this._target);
      var image = new Image(10, 10);
      image.src = 'http://localhost/urbanetic/atlas-cesium-demo/atlas/resources/images/handle.png';
      billboards.add({
        image: image,
        height: 10,
        width: 10,
        show: true,
        pixelOffset: new Cartesian2(0.0, 1.0),
        eyeOffset: new Cartesian3(0, 0, 100),
        position: position
      });
    },

    show: function() {
      //return this._dot.show();
    },

    hide: function() {
      //return this._dot.hide();
    },

    remove: function() {
      this._super();
      //this._dot.remove();
    }

  });

  return Handle;
});

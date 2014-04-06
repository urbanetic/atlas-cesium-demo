define([
  'atlas/model/GeoPoint',
  'atlas-cesium/model/Ellipse',
  // Base class.
  'atlas/model/Handle'
], function (GeoPoint, Ellipse, HandleCore) {

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
  Handle = HandleCore.extend( /** @lends atlas.model.Handle# */ {

    // TODO(bpstudds): Using an Ellipse isn't going to work. I'll have to switch it for
    // a billboard or similar.
    /**
     * The Ellipse representing the handle.
     * @type {atlas-cesium.model.Ellipse}
     * @private
     */
    _dot: null,

    _init: function (args) {
      this._super(args);
      var vertex = this.getLinked().getCentroid ? this.getLinked().getCentroid() : this.getLinked(),
          centroid = GeoPoint.fromVertex(vertex);
      args.renderManager = this.getTarget()._renderManager;
      args.eventManager = this.getTarget()._eventManager;
      this._dot = new Ellipse(this.getId(), {centroid: centroid, semiMajor: this._dotRadius}, args);
    },

    render: function () {
      this._dot.show();
    },

    unrender: function () {
      this._dot.remove();
    }
  });

  return Handle;

});

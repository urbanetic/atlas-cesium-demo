define([
  'atlas/model/GeoPoint',
  'atlas-cesium/model/Ellipse',
  // Base class.
  'atlas/model/Handle'
], function(GeoPoint, Ellipse, HandleCore) {

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

    /**
     * The Ellipse representing the handle.
     * @type {atlas-cesium.model.Ellipse}
     * @private
     */
    _dot: null,

    /**
     * Creates a new dot instance
     * @param args
     * @returns {Ellipse}
     * @private
     */
    _createDot: function(args) {
      return new Ellipse(this.getId(),
          {centroid: this._target, semiMajor: this._dotRadius}, args);
    },

    show: function() {
      return this._dot.show();
    },

    hide: function() {
      return this._dot.hide();
    },

    remove: function() {
      this._super();
      this._dot.remove();
    }

  });

  return Handle;
});

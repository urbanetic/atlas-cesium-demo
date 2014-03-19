define([
  // Base class.
  'atlas/model/Handle'
], function (HandleCore) {

  /**
   * @classdesc This class extends the Atlas Handle class so it can be rendered
   * using cesium.
   *
   * @class atlas-cesium.model.Handle
   * @extends atlas.model.Handle
   */
  return HandleCore.extend( /** @lends atlas.model.Handle# */ {

    /**
     * The Polygon representing the handle.
     * @type {atlas-cesium.model.Polygon}
     * @private
     */
    _polygon: null,

    _init: function (args) {
      this._super(args);
    },
  });

});

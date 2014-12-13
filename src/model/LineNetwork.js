define([
  'atlas-cesium/model/Line',
  // Base class
  'atlas/model/LineNetwork'
], function(Line, LineNetworkCore) {
  /**
   * @typedef atlas-cesium.model.LineNetwork
   * @ignore
   */
  var LineNetwork;

  /**
   * The Atlas-Cesium implementation of @link{atlas.model.LineNetwork}.
   * @class atlas-cesium.model.LineNetwork
   * @extends atlas.model.LineNetwork
   */
  LineNetwork = LineNetworkCore.extend({
    /**
     * The array of Lines constructing the line network.
     * @type {atlas-cesium.model.Line}
     * @private
     */
    _lines: null,

    _createLineObj: function(id, lineData, args) {
      return new Line(id, lineData, args);
    }
  });

  return LineNetwork;
});

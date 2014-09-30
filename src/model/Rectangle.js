define([
  'atlas/model/Rectangle',
  'atlas/util/AtlasMath',
  'atlas-cesium/cesium/Source/Core/Rectangle'
], function(RectangleCore, AtlasMath, CesiumRectangle) {

  /**
   * @typedef atlas-cesium.model.Rectangle
   * @ignore
   */
  var Rectangle;

  /**
   * @class atlas-cesium.model.Rectangle
   * @extends atlas.model.Rectangle
   */
  Rectangle = RectangleCore.extend(/** @lends atlas-cesium.model.Rectangle# */ {

    toCesiumRectangle: function() {
      return new CesiumRectangle(
          AtlasMath.toRadians(this.west), AtlasMath.toRadians(this.south),
          AtlasMath.toRadians(this.east), AtlasMath.toRadians(this.north));
    }

  });

  return Rectangle;
});

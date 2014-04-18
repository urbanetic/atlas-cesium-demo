define([
  'atlas/model/Style',
  './Colour',
  'atlas/util/mixin'
], function(StyleCore, Colour, mixin) {
  /**
   * @typedef atlas-cesium.model.Style
   * @ignore
   */
  var Style;

  /**
   * @class atlas-cesium.model.Style
   * @extends atlas.model.Style
   */
  Style = mixin(StyleCore.extend(/** @lends atlas-cesium.model.Style# */ {

  }), {

    // -------------------------------------------
    // STATICS
    // -------------------------------------------

    /**
     * Takes an atlas Style object and converts it to Cesium Color objects.
     * @param style
     */
    toCesiumColors: function(style) {
      return {
        fill: Colour.toCesiumColor(style.getFillColour()),
        border: Colour.toCesiumColor(style.getBorderColour())
      }
    }

  });

  return Style;
});

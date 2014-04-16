define([
  'atlas/model/Style',
  './Colour',
  'atlas/util/mixin'
], function(StyleCore, Colour, mixin) {

  /**
   * @class atlas-cesium.model.Style
   * @extends atlas.model.Style
   */
  return mixin(StyleCore.extend(/** @lends atlas-cesium.model.Style# */ {

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

});

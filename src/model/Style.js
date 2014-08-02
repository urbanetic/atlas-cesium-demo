define([
  'atlas/lib/utility/Setter',
  'atlas/model/Style',
  'atlas-cesium/model/Colour'
], function(Setter, StyleCore, Colour) {
  /**
   * @typedef atlas-cesium.model.Style
   * @ignore
   */
  var Style;

  /**
   * @class atlas-cesium.model.Style
   * @extends atlas.model.Style
   */
  Style = Setter.mixin(StyleCore.extend(/** @lends atlas-cesium.model.Style# */ {

  }), {

    // -------------------------------------------
    // STATICS
    // -------------------------------------------

    /**
     * Takes an atlas Style object and converts it to Cesium Color objects.
     * @param style
     */
    toCesiumColors: function(style) {
      var fill = style.getFillColour();
      var border = style.getBorderColour();
      return {
        fill: fill ? Colour.toCesiumColor(fill) : null,
        border: border ? Colour.toCesiumColor(border) : null
      }
    }

  });

  return Style;
});

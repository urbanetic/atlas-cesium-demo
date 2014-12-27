define([
  'atlas/lib/utility/Setter',
  'atlas/model/Style',
  'atlas-cesium/model/Color'
], function(Setter, StyleCore, Color) {
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
     * @param {atlas.model.Style} style
     */
    toCesiumColors: function(style) {
      var fill = style.getFillMaterial();
      var border = style.getBorderMaterial();
      return {
        fill: fill ? Color.toCesiumColor(fill) : null,
        border: border ? Color.toCesiumColor(border) : null
      }
    }

  });

  return Style;
});

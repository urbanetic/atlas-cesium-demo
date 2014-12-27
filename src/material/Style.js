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

  });

  return Style;
});

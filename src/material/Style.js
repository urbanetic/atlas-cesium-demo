define([
  'atlas/lib/utility/Setter',
  'atlas/material/Style'
], function(Setter, StyleCore) {
  /**
   * @typedef atlas-cesium.material.Style
   * @ignore
   */
  var Style;

  /**
   * @class atlas-cesium.material.Style
   * @extends atlas.material.Style
   */
  Style = Setter.mixin(StyleCore.extend(/** @lends atlas-cesium.material.Style# */ {

  }));

  return Style;
});

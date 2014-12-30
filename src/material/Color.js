define([
  'atlas/material/Color',
  'atlas-cesium/cesium/Source/Core/Color',
  'atlas-cesium/cesium/Source/Scene/Material',
], function(ColorCore, CesiumColor, Material) {
  /**
   * @typedef atlas-cesium.model.Color
   * @ignore
   */
  var Color;

  /**
   * @class atlas-cesium.material.Color
   * @extends atlas.material.Color
   */
  Color = ColorCore.extend(/** @lends atlas-cesium.material.Color# */ {

    /**
     * @returns {Color} This color converted to the Cesium format.
     */
    toCesiumColor: function() {
      return new CesiumColor(this.red, this.green, this.blue, this.alpha);
    },

    toCesiumMaterial: function() {
      return new Material({
        fabric: {
          type: 'Color',
          uniforms: {
            color: this.toCesiumColor()
          }
        },
        translucent: false
      });
    }

  });

  return Color;
});

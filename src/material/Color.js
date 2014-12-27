define([
  'atlas/lib/utility/Setter',
  'atlas/material/Color',
  'atlas-cesium/cesium/Source/Core/Color',
  'atlas-cesium/cesium/Source/Scene/Material',
], function(Setter, ColorCore, CesiumColor, Material) {
  /**
   * @typedef atlas-cesium.model.Line
   * @ignore
   */
  var Color;

  /**
   * @class atlas-cesium.material.Color
   * @extends atlas.material.Color
   */
  Color = Setter.mixin(ColorCore.extend(/** @lends atlas-cesium.material.Color# */ {

    /**
     * @returns {Color} This color converted to the Cesium format.
     */
    toCesiumColor: function() {
      // TODO(aramk) Transparency causes issues in Cesium so ignored for now.
      return new CesiumColor(this.red, this.green, this.blue, 1);
    },

    /**
     * @return {Material} This color conveted to a Cesium material.
     */
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

  }));

  return Color;
});

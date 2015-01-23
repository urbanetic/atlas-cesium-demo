define([
  'atlas/material/CheckPattern',
  'atlas-cesium/cesium/Source/Scene/Material',
], function(CheckPatternCore, Material) {
  /**
   * @typedef atlas-cesium.model.CheckPattern
   * @ignore
   */
  var CheckPattern;

  /**
   * @class atlas-cesium.material.CheckPattern
   * @extends atlas.material.CheckPattern
   */
  CheckPattern = CheckPatternCore.extend(/** @lends atlas-cesium.material.CheckPattern# */ {

    toCesiumMaterial: function() {
      var repeat = this.repeat;
      var color1 = this.color1;
      var color2 = this.color2;
      var isTranslucent = color1.alpha < 1 || color1.alpha < 1;
      return new Material({
        fabric: {
          type: 'Checkerboard',
          uniforms: {
            lightColor: color1.toCesiumColor(),
            darkColor: color2.toCesiumColor(),
            repeat: {x: repeat.x, y: repeat.y}
          }
        },
        translucent: isTranslucent
      });
    }

  });

  return CheckPattern;
});

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
      return new Material({
        fabric: {
          type: 'Checkerboard',
          uniforms: {
            lightColor: this.color1.toCesiumColor(),
            darkColor: this.color2.toCesiumColor(),
            repeat: {x: repeat.x, y: repeat.y}
          }
        },
        translucent: false
      });
    }

  });

  return CheckPattern;
});

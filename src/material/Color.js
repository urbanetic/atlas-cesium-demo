define([
  'atlas/lib/utility/Setter',
  'atlas/material/Color',
  'atlas-cesium/cesium/Source/Core/Color',
], function(Setter, ColourCore, CesiumColor) {
  /**
   * @typedef atlas-cesium.model.Line
   * @ignore
   */
  var Colour;

  /**
   * @class atlas-cesium.material.Color
   * @extends atlas.material.Color
   */
  Colour = Setter.mixin(ColourCore.extend(/** @lends atlas-cesium.material.Color# */ {

  }), {

    // -------------------------------------------
    // STATICS
    // -------------------------------------------

    // TODO(aramk) Constructing this subclass instead of an atlas colour must be abstracted in atlas
    // (e.g. using the abstract factory and/or factory method).
    // For now I've provided a static method so this class is more like a utility class.

    /**
     * Converts an Atlas Colour object to a Cesium Color object.
     * @param {atlas.material.Color} color - The Colour to convert.
     * @returns {atlas-cesium.material.Color} The converted Cesium Color object.
     * @memberOf atlas-cesium.material.Color
     * @static
     */
    toCesiumColor: function(color) {
      return new CesiumColor(color.red, color.green, color.blue, /* override alpha temporarily*/ 1);
    }

  });
  return Colour;
});

define([
  'atlas/model/Colour',
  'atlas-cesium/cesium/Source/Core/Color',
  'atlas/util/mixin'
], function(ColourCore, CesiumColor, mixin) {
  /**
   * @class atlas-cesium.model.Colour
   * @extends atlas.model.Colour
   */
  var Colour = mixin(ColourCore.extend(/** @lends atlas-cesium.model.Colour# */ {

  }), {

    // -------------------------------------------
    // STATICS
    // -------------------------------------------

    // TODO(aramk) Constructing this subclass instead of an atlas colour must be abstracted in atlas
    // (e.g. using the abstract factory and/or factory method).
    // For now I've provided a static method so this class is more like a utility class.

    /**
     * Converts an Atlas Colour object to a Cesium Color object.
     * @param {atlas.model.Colour} color - The Colour to convert.
     * @returns {atlas-cesium.model.Colour} The converted Cesium Color object.
     */
    toCesiumColor: function(color) {
      return new CesiumColor(color.red, color.green, color.blue, /* override alpha temporarily*/ 1);
    }

  });
  return Colour;
});

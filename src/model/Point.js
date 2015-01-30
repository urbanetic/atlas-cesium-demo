define([
  'atlas/material/Color',
  'atlas/model/Point',
  'atlas/util/Paths',
  'atlas/util/WKT',
  'atlas-cesium/material/Color',
  'atlas-cesium/cesium/Source/Core/Cartesian3'
], function(ColorCore, PointCore, Paths, WKT, Color, Cartesian3) {

  /**
   * @typedef atlas-cesium.model.Point
   * @ignore
   */
  var Point;

  /**
   * @class atlas-cesium.model.Point
   * @extends atlas.model.Point
   */
  Point = PointCore.extend(/** @lends atlas.model.Point# */ {

    _billboard: null,

    _build: function() {
      var renderManager = this._renderManager;
      var billboards = renderManager.getBillboards();
      var position = renderManager.cartesianFromGeoPoint(this.getPosition());
      var eyeOffset = new Cartesian3(0, this.getElevation(), 0);
      var style = this.getStyle();
      var fillMaterial = style.getFillMaterial();
      if (this.isDirty('model') || this.isDirty('entity') || this.isDirty('style')) {
        var color = this._getFillColor();
        // this._billboard && billboards.remove(this._billboard);
        if (this._billboard) {
          this._billboard.position = position;
          this._billboard.eyeOffset = eyeOffset;
          this._billboard.color = color;
        } else {
          var billboardArgs = {
            id: this.getId(),
            image: Paths.getInstance().getResourceDirectory() + 'images/point.png',
            eyeOffset: eyeOffset,
            position: position
          };
          if (fillMaterial) {
            billboardArgs.color = color;
          }
          this._billboard = billboards.add(billboardArgs);
        }
      }
    },

    remove: function() {
      this._super();
      var billboards = this._renderManager.getBillboards();
      billboards.remove(this._billboard);
    },

    getOpenLayersGeometry: function() {
      wkt = WKT.getInstance();
      return wkt.openLayersPointsFromGeoPoints([this._position])[0];
    },

    _updateVisibility: function(visible) {
      if (this._billboard) this._billboard.show = visible;
    },

    _getFillColor: function() {
      var style = this.getStyle();
      var material = style.getFillMaterial();
      if (material instanceof ColorCore) {
        return Color.prototype.toCesiumColor.bind(material)();
      } else {
        // Only color is supported for polyline borders at the moment. Reject all other materials.
        throw new Error('Only Color material is supported for Polygon border.');
      }
    }

  });

  return Point;
});

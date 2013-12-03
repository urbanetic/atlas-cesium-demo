define([
  'atlas/util/Extends',
  'atlas/model/Polygon',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Core/PolygonGeometry',
  'atlas-cesium/cesium/Source/Core/Cartographic',
  'atlas-cesium/cesium/Source/Scene/EllipsoidSurfaceAppearance',
  'atlas-cesium/cesium/Source/Scene/MaterialAppearance',
  'atlas-cesium/cesium/Source/Core/Color'
], function (extend, PolygonCore, GeometryInstance, PolygonGeometry, Cartographic, EllipsoidSurfaceAppearance, MaterialAppearance, CesiumColour) {
  "use strict";

  var Polygon = function (id, vertices, args) {
    // Call base constructor
    Polygon.base.constructor.call(this, id, vertices, args);
    /*=====
    Inherited from atlas/model/Polygon
    this._vertices
    this._height
    this._elevation
    this._style
    this._material
    this._visible
    this._renderable
    this._geometry
    this._appearance
    this._centroid
    this._area
    =====*/

    /**
     * An array of Cesiu cartesian coordinates describing the position of the Polygon
     * on the Cesium globe.
     * @see  {@link http://cesiumjs.org/Cesium/Build/Documentation/Cartesian3.html}
     * @type {Cartesian3}
     */
    this._cartesians = null;

    /**
     * The minimum terrain elevation underneath the Polygon.
     * @type {Number}
     */
    this._minTerrainElevation = 0.0;
  };
  extend(PolygonCore, Polygon);


  /**
   * Builds the geometry and appearance data required to render the Polygon in
   * Cesium.
   *
   * @param {number} minTerrainElevation - The minimum height of the terrain 
   *        in the area covered by this polygon.
   */
  Polygon.prototype.build = function (ellipsoid, minTerrainElevation) {
    console.log('building polygon');
    this._cartesians = Polygon._coordArrayToCartesianArray(ellipsoid, this._vertices);
    this._minTerrainElevation = minTerrainElevation || 0;
    // For 3D extruded polygons, ensure polygon is not closed as it causes
    // rendering to hang.
    if (this._height > 0) {
      if (this._cartesians[0] == this._cartesians[this._cartesians.length - 1]) {
        vertices.pop();
      }
    }
    // Generate geometry data.
    this._geometry = new GeometryInstance({
      id: this._id,
      geometry: new PolygonGeometry({
        polygonHierarchy: {positions: this._cartesians},
        height: this._minTerrainElevation + this._elevation,
        extrudedHeight: this._minTerrainElevation + this._elevation + this._height
      })
    });
    // Generate appearance data
    console.debug('build polygon with height', this._height);
    if (this._height === 0) {
      this._appearance = new EllipsoidSurfaceAppearance();
    } else {
      this._appearance = new MaterialAppearance({closed: true});
    }
    var cesiumColour = new CesiumColour(this._style.fillColour.red,
        this._style.fillColour.green,
        this._style.fillColour.blue,
        this._style.fillColour.alpha);
    this._appearance.material.uniforms.color = cesiumColour;
    this._setRenderable(true);
    console.log('created geometry', this._geometry);
    console.log('created appearance', this._appearance);
  };

  /**
   * Function to covert an array of lat/long coordinates to
   *     the Cartesian (x,y,z with respect to globe 3d ellipsoid) format
   *     required for Cesium.[_coordArrayToCartesianArray description]
   * @private
   * @param  {Ellipsoid} ellipsoid - The Cesium ellipsoid being rendered to.
   * @param  {atlas/model/Vertex} coords - The latlong coordinates to convert.
   * @return {Cartesian3} Array of Cartesian3 coordinates.
   */
  Polygon._coordArrayToCartesianArray = function (ellipsoid, coords) {
    var cartographics = [];
    for (var i = 0; i < coords.length; i++) {
      cartographics[i] = Cartographic.fromDegrees(
          /*longitude*/ coords[i][1],
          /*latitude*/  coords[i][0]
      );
    }
    return ellipsoid.cartographicArrayToCartesianArray(cartographics);
  };

  return Polygon;
});

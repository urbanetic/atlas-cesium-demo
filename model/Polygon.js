define([
  'atlas/util/Extends',
  'atlas/model/Polygon',
  'atlas/model/Style',
  'atlas/model/Colour',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Core/PolygonGeometry',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  'atlas-cesium/cesium/Source/Core/Cartographic',
  'atlas-cesium/cesium/Source/Scene/EllipsoidSurfaceAppearance',
  'atlas-cesium/cesium/Source/Scene/MaterialAppearance',
  'atlas-cesium/cesium/Source/Core/Color'
], function (extend,
             PolygonCore,
             Style,
             Colour,
             GeometryInstance,
             PolygonGeometry,
             Primitive,
             Cartographic,
             EllipsoidSurfaceAppearance,
             MaterialAppearance,
             CesiumColour) {
  "use strict";

  var Polygon = function (id, vertices, args) {
    // Call base constructor
    Polygon.base.constructor.call(this, id, vertices, args);
    /*
     * Inherited from atlas/model/Polygon
     *    this._renderManager
     *    this._vertices
     *    this._height
     *    this._elevation
     *    this._style
     *    this._material
     *    this._visible
     *    this._renderable
     *    this._geometry
     *    this._appearance
     *    this._centroid
     *    this._area
     */

    /**
     * The Cesium GeometryInstance of the Polygon.
     * @type {GeometryInstance}
     * @private
     */
    this._geometry = null;

    /**
     * The Cesium appearance data of the Polygon.
     * @type {EllipsoidSurfaceAppearance|MaterialAppearance}
     * @private
     */
    this._appearance = null;

    /**
     * The Cesium Primitive instance of the Polygon, used to render the Polygon in Cesium.
     * @type {Primitive}
     * @private
     */
    this._primitive = null;

    /**
     * An array of Cesium cartesian coordinates describing the position of the Polygon
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

    this._primitive = null;
  };
  extend(PolygonCore, Polygon);

  /**
   * Defines the default style to use when rendering a polygon.
   * @type {atlas/model/Colour}
   */
  Polygon.DEFAULT_STYLE = new Style(Colour.GREEN, Colour.GREEN, 1);

  /**
   * Defines the default style to use when rendering a selected polygon.
   * @type {atlas/model/Colour}
   */
  Polygon.SELECTED_STYLE = new Style(Colour.RED, Colour.RED, 1);

  /**
   * Returns whether this Polygon is visible. Overrides the default Atlas implementation
   * to use the visibility flag that is set of the Cesium Primitive of the Polygon.
   * @returns {Boolean} - Whether the Polygon is visible.
   */
  Polygon.prototype.isVisible = function () {
    return this._primitive && this._primitive.show;
  };

  /**
   * Shows the Polygon. If the current rendering data is out of data, the polygon is
   * rebuilt and then rendered.
   */
  Polygon.prototype.show = function () {
    if (this.isVisible() && this.isRenderable()) {
      console.debug('entity ' + this._id + 'already visible and correctly rendered');
    } else {
      if (!this.isRenderable()) {
        if (!this._primitive) {
          // Create the primitive is it doesn't exist.
          this._createPrimitive();
          this._renderManager._widget.scene.getPrimitives().add(this._primitive);
        } else {
          // Otherwise rebuild primitive as required.
          // TODO(bpstudds): Work out how to do the rebuild.
          this._createPrimitive();
          this._renderManager._widget.scene.getPrimitives().add(this._primitive);
        }
      }
      console.log('showing entity '+this._id);
      this._primitive.show = true;
    }
    return this.isRenderable() && this._primitive.show;
  };

  /**
   * Hides the Polygon.
   */
  Polygon.prototype.hide = function () {
    if (this.isVisible()) {
      this._primitive.show = false;
    }
    return this._primitive.show;
  };
  
  Polygon.prototype.onSelect = function () {
    this.setStyle(Polygon.SELECTED_STYLE);
    if (this._primitive) {
      this._appearance.material.uniforms.color = Polygon._convertStyleToCesiumColors(this._style).fill;
    }
  };

  Polygon.prototype.onDeselect = function () {
    this.setStyle(Polygon.DEFAULT_STYLE);
    if (this._primitive) {
      this._appearance.material.uniforms.color = Polygon._convertStyleToCesiumColors(this._style).fill;
    }
  };

  /**
   * Translate the Polygon.
   * @param {atlas/model/Vertex} diff - The vector from the Polygon's current location to the desired location.
   * @param {Number} diff.x - The change in latitude, given in decimal degrees.
   * @param {Number} diff.y - The change in longitude, given in decimal degrees.
   * @param {Number} diff.z - The change in altitude, given in metres.
   */
  Polygon.prototype.translate = function (diff) {
    for (var i = 0; i < this._vertices.length; i++) {
      this._vertices[i] = this._vertices[i].add(diff);
    }
    this.setRenderable(false);
    this.show();
  };
  
  /**
   * Generates the data structures required to render a Polygon
   * in Cesium.
   */
  Polygon.prototype._createPrimitive = function () {
    console.debug('creating primitive for entity', this._id);
    if (!this.isRenderable()) {
      if (this._primitive) {
        this._renderManager._widget.scene.getPrimitives().remove(this._primitive);
      }
      this._build(this._renderManager._widget.centralBody.getEllipsoid(),
          this._renderManager.getMinimumTerrainHeight(this._vertices));
      this._primitive =
          new Primitive({geometryInstances: this.getGeometry(),
              appearance: this.getAppearance()});
    }
    // Check that the primitive has been correctly created.
    this._renderable = (this._primitive instanceof Primitive);
    if (!this._renderable) console.error('Cesium Primitive not correctly created', this._primitive);
  };

  /**
   * Builds the geometry and appearance data required to render the Polygon in
   * Cesium.
   * @param {Ellipsoid} ellipsoid - The ellipsoid being rendered onto.
   * @param {Number} minTerrainElevation - The minimum height of the terrain
   *        in the area covered by this polygon.
   */
  Polygon.prototype._build = function (ellipsoid, minTerrainElevation) {
    // TODO(bpstudds): Need to cache computed geometry and appearance data somehow.
    console.debug('building entity', this._id);
    this._cartesians = Polygon._coordArrayToCartesianArray(ellipsoid, this._vertices);
    this._minTerrainElevation = minTerrainElevation || 0;
    // For 3D extruded polygons, ensure polygon is not closed as it causes
    // rendering to hang.
    if (this._height > 0) {
      if (this._cartesians[0] === this._cartesians[this._cartesians.length - 1]) {
        this._cartesians.pop();
      }
    }
    // Generate geometry data.
    this._geometry = new GeometryInstance({
      id: this._id.replace('polygon', ''),
      geometry: PolygonGeometry.fromPositions({
        positions: this._cartesians,
        height: this._minTerrainElevation + this._elevation,
        extrudedHeight: this._minTerrainElevation + this._elevation + this._height
      })
    });
    // Generate appearance data
    if (this._height === undefined || this._height === 0) {
      this._appearance = new EllipsoidSurfaceAppearance();
    } else {
      // TODO(bpstudds): Fix rendering so that 'closed' can be enabled.
      //                 This may require sorting of vertices before rendering.
      this._appearance = new MaterialAppearance({
        closed: false,
        translucent: false,
        faceForward: true
      });
    }
    this._appearance.material.uniforms.color = Polygon._convertStyleToCesiumColors(this._style).fill;
  };

  /**
   * Function to covert an array of lat/long coordinates to
   *     the Cartesian (x,y,z with respect to globe 3d ellipsoid) format
   *     required for Cesium.[_coordArrayToCartesianArray description]
   * @private
   * @param {Ellipsoid} ellipsoid - The Cesium ellipsoid being rendered to.
   * @param {atlas/model/Vertex} coords - The latlong coordinates to convert.
   * @returns {Cartesian3} Array of Cartesian3 coordinates.
   */
  Polygon._coordArrayToCartesianArray = function (ellipsoid, coords) {
    var cartographics = [];
    for (var i = 0; i < coords.length; i++) {
      cartographics.push(Cartographic.fromDegrees(
        /*longitude*/ coords[i].y,
        /*latitude*/  coords[i].x)
      );
    }
    return ellipsoid.cartographicArrayToCartesianArray(cartographics);
  };

  /**
   * Takes an atlas Style object and converts it to Cesium Color objects.
   * @param style
   * @private
   */
  Polygon._convertStyleToCesiumColors = function(style) {
    return {
      fill: Polygon._convertAtlasToCesiumColor(style.fillColour),
      border: Polygon._convertAtlasToCesiumColor(style.borderColour)
    }
  };

  /**
   * Converts an Atlas Colour object to a Cesium Color object.
   * @param {atlas/model/Colour} color - The Colour to convert.
   * @returns {cesium/Core/Color} The converted Cesium Color object.
   * @private
   */
  Polygon._convertAtlasToCesiumColor = function (color) {
    // TODO(bpstudds) Determine how to get Cesium working with alpha enabled.
    return new CesiumColour(color.red, color.green, color.blue, /* override alpha temporarily*/ 1);
  };

  return Polygon;
});

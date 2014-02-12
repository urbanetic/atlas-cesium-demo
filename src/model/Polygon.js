define([
  'atlas/model/Style',
  'atlas/model/Colour',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Core/PolygonGeometry',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  'atlas-cesium/cesium/Source/Core/Cartographic',
  'atlas-cesium/cesium/Source/Scene/EllipsoidSurfaceAppearance',
  'atlas-cesium/cesium/Source/Scene/MaterialAppearance',
  'atlas-cesium/cesium/Source/Core/Color',
  // Base class
  'atlas/model/Polygon',
  'atlas/lib/utility/Log'
], function(Style, Colour, GeometryInstance, PolygonGeometry, Primitive, Cartographic,
            EllipsoidSurfaceAppearance, MaterialAppearance, CesiumColour, PolygonCore, Log) {
  "use strict";

  //var Polygon = function (id, vertices, args) {
  var Polygon = PolygonCore.extend(/** @lends atlas-cesium.model.Polygon# */ {

    /**
     * The Cesium GeometryInstance of the Polygon.
     * @type {GeometryInstance}
     * @private
     */
    _geometry: null,

    /**
     * The Cesium appearance data of the Polygon.
     * @type {EllipsoidSurfaceAppearance|MaterialAppearance}
     * @private
     */
    _appearance: null,

    /**
     * The Cesium Primitive instance of the Polygon, used to render the Polygon in Cesium.
     * @type {Primitive}
     * @private
     */
    _primitive: null,

    /**
     * An array of Cesium cartesian coordinates describing the position of the Polygon
     * on the Cesium globe.
     * @see  {@link http://cesiumjs.org/Cesium/Build/Documentation/Cartesian3.html}
     * @type {Cartesian3}
     */
    _cartesians: null,

    /**
     * The minimum terrain elevation underneath the Polygon.
     * @type {Number}
     */
    _minTerrainElevation: 0.0,

    /**
     * The style of the GeoEntity when before a change in style (e.g. during selection).
     * @type {atlas.model.Style}
     * @protected
     */
    _previousStyle: null,

    // -------------------------------------------
    // GETTERS AND SETTERS
    // -------------------------------------------

    /**
     * Returns whether this Polygon is visible. Overrides the default Atlas implementation
     * to use the visibility flag that is set of the Cesium Primitive of the Polygon.
     * @returns {Boolean} - Whether the Polygon is visible.
     */
    isVisible: function() {
      return !!(this._primitive && this._primitive.show);
    },

    // -------------------------------------------
    // MODIFIERS
    // -------------------------------------------

    /**
     * Generates the data structures required to render a Polygon
     * in Cesium.
     */
    _createPrimitive: function() {
      Log.debug('creating primitive for entity', this.getId());
      this._geometry = this._updateGeometry();
      this._appearance = this._updateAppearance();
      return new Primitive({
        geometryInstances: this.getGeometry(),
        appearance: this.getAppearance()
      });
    },

    /**
     * Updates the geometry data as required.
     * @returns {GeometryInstance}
     * @private
     */
    _updateGeometry: function() {
      var ellipsoid = this._renderManager._widget.centralBody.getEllipsoid();

      // Generate new cartesians if the vertices have changed.
      if (this.isDirty('entity') || this.isDirty('vertices') || this.isDirty('model')) {
        Log.debug('updating geometry for entity ' + this.getId());
        this._cartesians = Polygon._coordArrayToCartesianArray(ellipsoid, this._vertices);
        this._minTerrainElevation = this._renderManager.getMinimumTerrainHeight(this._vertices);

        // For 3D extruded polygons, ensure polygon is not closed as it causes
        // rendering to hang.
        if (this._height > 0) {
          if (this._cartesians[0] === this._cartesians[this._cartesians.length - 1]) {
            this._cartesians.pop();
          }
        }
      }

      // Generate geometry data.
      return new GeometryInstance({
        id: this.getId().replace('polygon', ''),
        geometry: PolygonGeometry.fromPositions({
          positions: this._cartesians,
          height: this._minTerrainElevation + this._elevation,
          extrudedHeight: this._minTerrainElevation + this._elevation + this._height
        })
      });
    },

    /**
     * Updates the appearance data.
     * @private
     */
    _updateAppearance: function() {

      if (this.isDirty('entity') || this.isDirty('style')) {
        Log.debug('updating appearance for entity ' + this.getId());
        if (!this._appearance) {
          // TODO(bpstudds): Fix rendering so that 'closed' can be enabled.
          //                 This may require sorting of vertices before rendering.
          this._appearance = new MaterialAppearance({
            closed: false,
            translucent: false,
            faceForward: true
          });
        }
        this._appearance.material.uniforms.color =
            Polygon._convertStyleToCesiumColors(this._style).fill;
      }
      return this._appearance;
    },

    /**
     * Builds the geometry and appearance data required to render the Polygon in
     * Cesium.
     */
    _build: function() {
      if (!this._primitive || this.isDirty('vertices') || this.isDirty('model')) {
        if (this._primitive) {
          this._renderManager._widget.scene.getPrimitives().remove(this._primitive);
        }
        this._primitive = this._createPrimitive();
        this._renderManager._widget.scene.getPrimitives().add(this._primitive);
      } else if (this.isDirty('style')) {
        this._updateAppearance();
      }
      this.clean();
    },

    /**
     * Shows the Polygon. If the current rendering data is out of data, the polygon is
     * rebuilt and then rendered.
     * @returns {Boolean} Whether the polygon is shown.
     */
    show: function() {
      if (this.isVisible() && this.isRenderable()) {
        Log.debug('entity ' + this.getId() + 'already visible and correctly rendered');
      } else {
        Log.debug('showing entity ' + this.getId());
        if (!this.isRenderable()) {
          this._build();
        }
        this._primitive.show = true;
      }
      return this.isRenderable() && this.isVisible();
    },

    /**
     * Hides the Polygon.
     * @returns {Boolean} Whether the polygon is hidden.
     */
    hide: function() {
      if (this.isVisible()) {
        Log.debug('hiding entity ' + this.getId());
        this._primitive.show = false;
      }
      return !this.isVisible();
    },

    /**
     * Function to permanently remove the Polygon from the scene (vs. hiding it).
     */
    remove: function() {
      this._super();
      this._primitive && this._renderManager._widget.scene.getPrimitives().remove(this._primitive);
    },

    // -------------------------------------------
    // BEHAVIOUR
    // -------------------------------------------

    onSelect: function() {
      this._previousStyle = this.setStyle(Polygon.SELECTED_STYLE);
      if (this.isVisible()) {
        this._appearance.material.uniforms.color =
            Polygon._convertStyleToCesiumColors(this._style).fill;
      }
      this.onEnableEditing();
    },

    onDeselect: function() {
      this.setStyle(this._previousStyle || Polygon.DEFAULT_STYLE);
      if (this.isVisible()) {
        this._appearance.material.uniforms.color =
            Polygon._convertStyleToCesiumColors(this._style).fill;
      }
      this.onDisableEditing();
    }
  });

  // -------------------------------------------
  // STATICS
  // -------------------------------------------

  /**
   * Defines the default style to use when rendering a polygon.
   * @type {atlas.model.Colour}
   */
  Polygon.DEFAULT_STYLE = new Style({fillColour: Colour.GREEN});

  /**
   * Defines the default style to use when rendering a selected polygon.
   * @type {atlas.model.Colour}
   */
  Polygon.SELECTED_STYLE = new Style({fillColour: Colour.RED});

  /**
   * Function to covert an array of lat/long coordinates to
   *     the Cartesian (x,y,z with respect to globe 3d ellipsoid) format
   *     required for Cesium.[_coordArrayToCartesianArray description]
   * @private
   * @param {Ellipsoid} ellipsoid - The Cesium ellipsoid being rendered to.
   * @param {atlas.model.Vertex} coords - The latlng coordinates to convert.
   * @returns {Cartesian3} Array of Cartesian3 coordinates.
   */
  Polygon._coordArrayToCartesianArray = function(ellipsoid, coords) {
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
      fill: Polygon._convertAtlasToCesiumColor(style.getFillColour()),
      border: Polygon._convertAtlasToCesiumColor(style.getBorderColour())
    }
  };

  /**
   * Converts an Atlas Colour object to a Cesium Color object.
   * @param {atlas.model.Colour} color - The Colour to convert.
   * @returns {Color} The converted Cesium Color object.
   * @private
   */
  Polygon._convertAtlasToCesiumColor = function(color) {
    // TODO(bpstudds) Determine how to get Cesium working with alpha enabled.
    return new CesiumColour(color.red, color.green, color.blue, /* override alpha temporarily*/ 1);
  };

  return Polygon;
});

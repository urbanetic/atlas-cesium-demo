define([
  'atlas/model/Colour',
  'atlas/model/Style',
  'atlas-cesium/model/Handle',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Core/PolygonGeometry',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  'atlas-cesium/cesium/Source/Core/Cartographic',
//  'atlas-cesium/cesium/Source/Scene/EllipsoidSurfaceAppearance',
  'atlas-cesium/cesium/Source/Scene/MaterialAppearance',
  'atlas-cesium/cesium/Source/Core/Color',
  // Base class
  'atlas/model/Polygon',
  'atlas/lib/utility/Log'
], function(Colour, Style, Handle, GeometryInstance, PolygonGeometry, Primitive, Cartographic,
            /*EllipsoidSurfaceAppearance,*/ MaterialAppearance, CesiumColour, PolygonCore, Log) {

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
     * @returns {Array.<atlas.model.Handle>} A handle for each of the vertices in the Polygon, as well as
     * one on the Polygon itself.
     */
    getEditingHandles: function () {
      if (this._editingHandles) { return this._editingHandles; }

      var handles = [],
          elevation = this.getElevation();

      // Add a Handle for the Polygon itself.
      handles.push(new Handle({linked: this}));

      // Add Handles for each vertex.
      this._vertices.forEach(function (vertex) {
        vertex.z = elevation;
        handles.push(new Handle({linked: vertex, target: this}));
      }.bind(this));

      return (this._editingHandles = handles);
    },

    /**
     * Returns whether this Polygon is visible. Overrides the default Atlas implementation
     * to use the visibility flag that is set of the Cesium Primitive of the Polygon.
     * @returns {Boolean} - Whether the Polygon is visible.
     */
    isVisible: function() {
      return this._primitive && this._primitive.show === true;
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
      // TODO(aramk) _geometry isn't actually set.
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
      // Generate new cartesians if the vertices have changed.
      if (this.isDirty('entity') || this.isDirty('vertices') || this.isDirty('model')) {
        Log.debug('updating geometry for entity ' + this.getId());
        this._cartesians = this._renderManager.cartesianArrayFromVertexArray(this._vertices);
        this._minTerrainElevation = this._renderManager.getMinimumTerrainHeight(this._vertices);
      }

      // TODO(aramk) The zIndex is currently absolute, not relative to the parent or using bins.
      var elevation = this._minTerrainElevation + this._elevation +
          this._zIndex * this._zIndexOffset;

      var holes = [];
      if (this._holes) {
        for (var i in this._holes) {
          var hole = this._holes[i];
          var cartesians = this._renderManager.cartesianArrayFromVertexArray(hole.coordinates);
          holes.push({positions : cartesians});
        }
      }
      // Generate geometry data.
      var polygonHierarchy = {
          positions : this._cartesians,
          holes : holes
        };
      return new GeometryInstance({
        id: this.getId().replace('polygon', ''),
        geometry: new PolygonGeometry({
          polygonHierarchy: polygonHierarchy,
          height: elevation,
          extrudedHeight: elevation + (this._showAsExtrusion ? this._height : 0)
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
      if (!this.isRenderable()) {
        this._build();
      } else if (this.isVisible()) {
        Log.debug('entity ' + this.getId() + ' already visible and correctly rendered');
        return true;
      }
      this._selected && this.onSelect();
      Log.debug('Showing entity ' + this.getId());
      this._primitive.show = true;
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
      this._selected = true;
      if (this.isVisible()) {
        this._appearance.material.uniforms.color =
            Polygon._convertStyleToCesiumColors(PolygonCore.getSelectedStyle()).fill;
      }
      this.onEnableEditing();
    },

    onDeselect: function() {
      this._selected = false;
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

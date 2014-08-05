define([
  // Base class
  'atlas/model/Polygon',
  'atlas-cesium/model/Handle',
  'atlas-cesium/model/Style',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Core/PolygonGeometry',
  'atlas-cesium/cesium/Source/Core/PolygonOutlineGeometry',
  'atlas-cesium/cesium/Source/Core/ColorGeometryInstanceAttribute',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  'atlas-cesium/cesium/Source/Scene/PerInstanceColorAppearance'
], function(PolygonCore, Handle, Style, GeometryInstance, PolygonGeometry, PolygonOutlineGeometry,
            ColorGeometryInstanceAttribute, Primitive, PerInstanceColorAppearance) {

  /**
   * @class atlas-cesium.model.Polygon
   * @extends atlas.model.Polygon
   */
  var Polygon = PolygonCore.extend(/** @lends atlas-cesium.model.Polygon# */ {

    /**
     * The Cesium GeometryInstance of the Polygon.
     * @type {GeometryInstance}
     * @private
     */
    _geometry: null,

    /**
     * The Cesium GeometryInstance of the Polygon outline.
     * @type {GeometryInstance}
     * @private
     */
    _outlineGeometry: null,

    /**
     * The Cesium Primitive instance of the Polygon.
     * @type {Primitive}
     * @private
     */
    _primitive: null,

    /**
     * The Cesium Primitive instance of the Polygon outline.
     * @type {Primitive}
     * @private
     */
    _outlinePrimitive: null,

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

    // -------------------------------------------
    // GETTERS AND SETTERS
    // -------------------------------------------

    /**
     * Returns whether this Polygon is visible. Overrides the default Atlas implementation
     * to use the visibility flag that is set of the Cesium Primitive of the Polygon.
     * @returns {Boolean} - Whether the Polygon is visible.
     */
    isVisible: function() {
      return (this._primitive && this._primitive.show === true) ||
          (this._outlinePrimitive && this._outlinePrimitive.show === true);
    },

    // -------------------------------------------
    // CONSTRUCTION
    // -------------------------------------------

    /**
     * Generates the data structures required to render a Polygon
     * in Cesium.
     */
    _createPrimitive: function() {
      var scene = this._renderManager.getScene();
      this._createGeometry();
      this._primitive = null;
      if (this._geometry) {
        this._primitive = new Primitive({
          geometryInstances: this._geometry,
          appearance: new PerInstanceColorAppearance({
            closed: true,
            translucent: false
          })
        });
      }
      this._outlinePrimitive = null;
      if (this._outlineGeometry) {
        this._outlinePrimitive = new Primitive({
          geometryInstances: this._outlineGeometry,
          appearance: new PerInstanceColorAppearance({
            flat: true,
            translucent: false,
            renderState: {
              depthTest: {
                enabled: true
              },
              lineWidth: Math.min(2.0, scene.maximumAliasedLineWidth)
            }
          })
        });
      }
    },

    /**
     * Adds the primitive to the scene.
     * @private
     */
    _addPrimitive: function() {
      this._primitive && this._renderManager.getPrimitives().add(this._primitive);
      this._outlinePrimitive && this._renderManager.getPrimitives().add(this._outlinePrimitive);
    },

    /**
     * Removes the primitive from the scene.
     * @private
     */
    _removePrimitive: function() {
      this._primitive && this._renderManager.getPrimitives().remove(this._primitive);
      this._outlinePrimitive && this._renderManager.getPrimitives().remove(this._outlinePrimitive);
    },

    createHandles: function() {
      var handles = [];
      // Add a Handle for the Polygon itself.
      handles.push(new Handle(this._bindDependencies({owner: this})));
      // Add Handles for each vertex.
      this._vertices.forEach(function(vertex) {
        // TODO(aramk) This modifies the underlying vertices - it should create copies and
        // respond to changes in the copies. Also move this method and createHandle() to
        // VertexedEntity.
        handles.push(this.createHandle(vertex));
      }, this);
      return handles;
    },

    createHandle: function(vertex) {
      return new Handle(this._bindDependencies({target: vertex, owner: this}));
    },

    // -------------------------------------------
    // MODIFIERS
    // -------------------------------------------

    /**
     * Creates the geometry data as required.
     * @private
     */
    _createGeometry: function() {
      // Generate new cartesians if the vertices have changed.
      if (this.isDirty('entity') || this.isDirty('vertices') || this.isDirty('model')) {
        this._cartesians = this._renderManager.cartesianArrayFromVertexArray(this._vertices);
        this._minTerrainElevation = this._renderManager.getMinimumTerrainHeight(this._vertices);
      }

      // TODO(aramk) The zIndex is currently absolute, not relative to the parent or using bins.
      var elevation = this._minTerrainElevation + this._elevation +
          this._zIndex * this._zIndexOffset;
      var height = (this._showAsExtrusion ? this._height : 0);

      var holes = [];
      if (this._holes) {
        for (var i in this._holes) {
          var hole = this._holes[i];
          var cartesians = this._renderManager.cartesianArrayFromVertexArray(hole.coordinates);
          holes.push({positions: cartesians});
        }
      }
      // Generate geometry data.
      var polygonHierarchy = {
        positions: this._cartesians,
        holes: holes
      };

      var cesiumColors = this._getCesiumColors();
      var fillColor = cesiumColors.fill;
      var borderColor = cesiumColors.border;
      var geometryId = this.getId().replace('polygon', '');

      this._geometry = null;
      if (fillColor) {
        this._geometry = new GeometryInstance({
          id: geometryId,
          geometry: new PolygonGeometry({
            polygonHierarchy: polygonHierarchy,
            height: elevation,
            extrudedHeight: elevation + height
          }),
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(fillColor)
          }
        });
      }

      this._outlineGeometry = null;
      if (borderColor) {
        this._outlineGeometry = new GeometryInstance({
          id: geometryId + '-outline',
          geometry: new PolygonOutlineGeometry({
            polygonHierarchy: polygonHierarchy,
            height: elevation,
            extrudedHeight: elevation + height
          }),
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(borderColor)
          }
        });
      }
    },

    /**
     * Updates the appearance data.
     * @private
     */
    _updateAppearance: function() {
      if (this.isDirty('entity') || this.isDirty('style')) {
        var cesiumColors = this._getCesiumColors();
        var fillColor = cesiumColors.fill;
        var borderColor = cesiumColors.border;
        if (this._geometry && fillColor) {
          var geometryAtts = this._primitive.getGeometryInstanceAttributes(this._geometry.id);
          geometryAtts.color = ColorGeometryInstanceAttribute.toValue(fillColor);
        }
        if (this._outlineGeometry && borderColor) {
          var outlineGeometryAtts =
              this._outlinePrimitive.getGeometryInstanceAttributes(this._outlineGeometry.id);
          outlineGeometryAtts.color = ColorGeometryInstanceAttribute.toValue(borderColor);
        }
      }
    },

    /**
     * Builds the geometry and appearance data required to render the Polygon in
     * Cesium.
     */
    _build: function() {
      if (this.isDirty('entity') || this.isDirty('vertices') || this.isDirty('model')) {
        this._removePrimitive();
        this._createPrimitive();
        this._addPrimitive();
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
        return true;
      }
      this._selected && this.onSelect();
      if (this._primitive) this._primitive.show = true;
      if (this._outlinePrimitive) this._outlinePrimitive.show = true;
      return this.isRenderable() && this.isVisible();
    },

    /**
     * Hides the Polygon.
     * @returns {Boolean} Whether the polygon is hidden.
     */
    hide: function() {
      if (this._primitive) this._primitive.show = false;
      if (this._outlinePrimitive) this._outlinePrimitive.show = false;
      return !this.isVisible();
    },

    /**
     * Function to permanently remove the Polygon from the scene (vs. hiding it).
     */
    remove: function() {
      this._super();
      this._primitive && this._renderManager.getPrimitives().remove(this._primitive);
      this._outlinePrimitive && this._renderManager.getPrimitives().remove(this._outlinePrimitive);
    },

    setStyle: function(style) {
      this._super(style);
      this._updateAppearance();
    },

    _getCesiumColors: function() {
      var style = this.getStyle();
      return Style.toCesiumColors(style);
    }

  });

  return Polygon;
});

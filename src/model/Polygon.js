define([
  // Base class
  'atlas/model/Polygon',
  'atlas-cesium/model/Handle',
  'atlas-cesium/model/Style',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Core/PolygonGeometry',
  'atlas-cesium/cesium/Source/Core/PolygonOutlineGeometry',
  'atlas-cesium/cesium/Source/Core/ColorGeometryInstanceAttribute',
  'atlas-cesium/cesium/Source/Core/VertexFormat',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  'atlas-cesium/cesium/Source/Scene/Material',
  'atlas-cesium/cesium/Source/Scene/PerInstanceColorAppearance',
  'atlas-cesium/cesium/Source/Scene/EllipsoidSurfaceAppearance'
], function(PolygonCore, Handle, Style, GeometryInstance, PolygonGeometry, PolygonOutlineGeometry,
            ColorGeometryInstanceAttribute, VertexFormat, Primitive, Material,
            PerInstanceColorAppearance, EllipsoidSurfaceAppearance) {

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
     * Builds the geometry and appearance data required to render the Polygon in
     * Cesium.
     */
    _build: function() {
      var cesiumColors = this._getCesiumColors();
      var fillColor = cesiumColors.fill;
      var borderColor = cesiumColors.border;
      var isModelDirty = this.isDirty('entity') || this.isDirty('vertices') ||
          this.isDirty('model');
      var isStyleDirty = this.isDirty('style');
      var primitives = this._renderManager.getPrimitives();
      var scene = this._renderManager.getScene();
      if (fillColor) {
        if (isModelDirty) {
          this._primitive && primitives.remove(this._primitive);
          if (isStyleDirty) {
            this._appearance = new EllipsoidSurfaceAppearance({
              material: new Material({
                fabric: {
                  type: 'Color',
                  uniforms: {
                    color: fillColor
                  }
                },
                translucent: false
              })
            });
          }
          this._createGeometry();
          this._primitive = new Primitive({
            geometryInstances: this._geometry,
            appearance: this._appearance
          });
        } else if (isStyleDirty) {
          this._appearance.material.uniforms.color = fillColor;
        }
      }
      if (borderColor) {
        if (isModelDirty) {
          this._outlinePrimitive && primitives.remove(this._outlinePrimitive);
          // TODO(aramk) Cannot use materials yet for outline geometries.
          this._createGeometry();
          this._outlinePrimitive = new Primitive({
            geometryInstances: this._outlineGeometry,
            // TODO(aramk) https://github.com/AnalyticalGraphicsInc/cesium/issues/2052
//          appearance: this._outlineAppearance
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
        } else if (isStyleDirty) {
          var timeout = 3000;
          var duration = 0;
          var freq = 100;
          // TODO(aramk) Store this on the instance and cancel the existing one if we make another
          // request before it is complete.
          var handle = setInterval(function() {
            if (this._outlinePrimitive.ready) {
              var outlineGeometryAtts =
                  this._outlinePrimitive.getGeometryInstanceAttributes(this._outlineGeometry.id);
              outlineGeometryAtts.color = ColorGeometryInstanceAttribute.toValue(borderColor);
              clearInterval(handle);
            }
            duration += freq;
            if (duration >= timeout) {
              clearInterval(handle);
            }
          }.bind(this), freq);
        }
      }
      this._addPrimitives();
      this._doShow();
      this._super();
    },

    /**
     * Adds the primitive to the scene.
     * @private
     */
    _addPrimitives: function() {
      this._primitive && this._renderManager.getPrimitives().add(this._primitive);
      this._outlinePrimitive && this._renderManager.getPrimitives().add(this._outlinePrimitive);
    },

    /**
     * Creates the geometry data as required.
     * @private
     */
    _createGeometry: function() {
      // Generate new cartesians if the vertices have changed.
      if (this.isDirty('entity') || this.isDirty('vertices') || this.isDirty('model')) {
        this._cartesians = this._renderManager.cartesianArrayFromGeoPointArray(this._vertices);
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
          var cartesians = this._renderManager.cartesianArrayFromGeoPointArray(hole.coordinates);
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
            extrudedHeight: elevation + height,
            vertexFormat: VertexFormat.POSITION_AND_ST
          })
        });
      }

      this._outlineGeometry = null;
      if (borderColor) {
        this._outlineGeometry = new GeometryInstance({
          id: geometryId + '-outline',
          geometry: new PolygonOutlineGeometry({
            polygonHierarchy: polygonHierarchy,
            height: elevation,
            extrudedHeight: elevation + height,
            vertexFormat: VertexFormat.POSITION_AND_ST
          }),
          // TODO(aramk) https://github.com/AnalyticalGraphicsInc/cesium/issues/2052
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(borderColor)
          }
        });
      }
    },

    createHandle: function(vertex, index) {
      // TODO(aramk) Use a factory to use the right handle class.
      return new Handle(this._bindDependencies({target: vertex, index: index, owner: this}));
    },

    // -------------------------------------------
    // MODIFIERS
    // -------------------------------------------

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
      this._doShow();
      return this.isRenderable() && this.isVisible();
    },

    _doShow: function() {
      var cesiumColors = this._getCesiumColors();
      var fillColor = cesiumColors.fill;
      var borderColor = cesiumColors.border;
      if (this._primitive) {
        this._primitive.show = !!fillColor;
      }
      if (this._outlinePrimitive) {
        this._outlinePrimitive.show = !!borderColor;
      }
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

    _getCesiumColors: function() {
      var style = this.getStyle();
      return Style.toCesiumColors(style);
    }

  });

  return Polygon;
});

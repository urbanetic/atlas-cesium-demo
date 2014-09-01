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
     * The minimum terrain elevation underneath the Polygon.
     * @type {Number}
     */
    _minTerrainElevation: 0.0,

    /**
     * The ID of the handler used for updating styles. Only one handler should be running. Any
     * existing handler should be cancelled.
     * @type {Number}
     */
    _updateStyleHandle: null,

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
      var cancelStyleUpdate = function() {
        clearInterval(this._updateStyleHandle);
        this._updateStyleHandle = null;
      }.bind(this);
      var scene = this._renderManager.getScene();
      if (isModelDirty) {
        this._removePrimitives();
      }
      this._createGeometry();
      if (isModelDirty || isStyleDirty) {
        // Cancel any existing handler for updating to avoid race conditions.
        cancelStyleUpdate();
      }
//      console.debug('build', 'isModelDirty', isModelDirty, 'isStyleDirty', isStyleDirty);
      if (fillColor) {
        if (isModelDirty || !this._primitive) {
          if (isStyleDirty || !this._appearance) {
            this._appearance = new EllipsoidSurfaceAppearance({
              material: new Material({
                fabric: {
                  type: 'Color',
                  uniforms: {
                    color: fillColor
                  }
                },
                translucent: false,
                flat: true
              })
            });
          }
          this._primitive = new Primitive({
            geometryInstances: this._geometry,
            appearance: this._appearance
          });
        } else if (isStyleDirty) {
          this._appearance.material.uniforms.color = fillColor;
        }
      }
      if (borderColor) {
        if (isModelDirty || !this._outlinePrimitive) {
          this._outlinePrimitive = new Primitive({
            geometryInstances: this._outlineGeometry,
            // TODO(aramk) https://github.com/AnalyticalGraphicsInc/cesium/issues/2052
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
          var setHandle = function() {
            this._updateStyleHandle = setInterval(updateStyle, freq);
          }.bind(this);
          var isReady = function() {
            return this._outlinePrimitive.ready;
          }.bind(this);
          var updateStyle = function() {
            if (isReady()) {
              var outlineGeometryAtts =
                  this._outlinePrimitive.getGeometryInstanceAttributes(this._outlineGeometry.id);
              outlineGeometryAtts.color = ColorGeometryInstanceAttribute.toValue(borderColor);
              cancelStyleUpdate();
            }
            duration += freq;
            duration >= timeout && cancelStyleUpdate();
          }.bind(this);
          // Only delay the update if necessary.
          if (isReady()) {
            updateStyle();
          } else {
            setHandle()
          }
        }
      }
      this._addPrimitives();
      this._doShow();
      this._super();
    },

    /**
     * Adds the primitives to the scene.
     * @private
     */
    _addPrimitives: function() {
      var primitives = this._renderManager.getPrimitives();
      this._primitive && primitives.add(this._primitive);
      this._outlinePrimitive && primitives.add(this._outlinePrimitive);
    },

    /**
     * Removes the primitives from the scene.
     * @private
     */
    _removePrimitives: function() {
      // TODO(aramk) Removing the primitives causes a crash with "primitive was destroyed". Hiding
      // them for now.
      var primitives = this._renderManager.getPrimitives();
      if (this._primitive) {
        this._primitive.show = false;
//        primitives.remove(this._primitive);
        this._primitive = null;
        this._geometry = null;
      }
      if (this._outlinePrimitive) {
        this._outlinePrimitive.show = false;
//        primitives.remove(this._outlinePrimitive);
        this._outlinePrimitive = null;
        this._outlineGeometry = null;
      }
    },

    /**
     * Creates the geometry data as required.
     * @private
     */
    _createGeometry: function() {
      var cesiumColors = this._getCesiumColors();
      var fillColor = cesiumColors.fill;
      var borderColor = cesiumColors.border;
      var geometryId = this.getId().replace('polygon', '');
      var isModelDirty = this.isDirty('entity') || this.isDirty('vertices') ||
          this.isDirty('model');

      var geometryIsDirty = fillColor && (isModelDirty || !this._geometry);
      var outlineGeometryIsDirty = borderColor && (isModelDirty || !this._outlineGeometry);

      if (geometryIsDirty || outlineGeometryIsDirty) {
        // Generate coordinates.
        var positions = this._renderManager.cartesianArrayFromGeoPointArray(this._vertices);
        var holes = [];
        this._holes && this._holes.forEach(function(holeArray) {
          if (holeArray.length > 0) {
            var positions = this._renderManager.cartesianArrayFromGeoPointArray(holeArray);
            holes.push({positions: positions});
          }
        }.bind(this));
        // Generate height and elevation.
        this._minTerrainElevation = this._renderManager.getMinimumTerrainHeight(this._vertices);
        // TODO(aramk) The zIndex is currently absolute, not relative to the parent or using bins.
        var elevation = this._minTerrainElevation + this._elevation +
            this._zIndex * this._zIndexOffset;
        var height = (this._showAsExtrusion ? this._height : 0);
        // Generate geometry data.
        var polygonHierarchy = {
          positions: positions,
          holes: holes
        };
        if (geometryIsDirty) {
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
        if (outlineGeometryIsDirty) {
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
      this._doShow();
      return this.isRenderable() && this.isVisible();
    },

    _doShow: function() {
      var visible = this.isVisible();
      var cesiumColors = this._getCesiumColors();
      var fillColor = cesiumColors.fill;
      var borderColor = cesiumColors.border;
      if (this._primitive) {
        this._primitive.show = visible && !!fillColor;
      }
      if (this._outlinePrimitive) {
        this._outlinePrimitive.show = visible && !!borderColor;
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
      this._removePrimitives();
    },

    _getCesiumColors: function() {
      var style = this.getStyle();
      return Style.toCesiumColors(style);
    }

  });

  return Polygon;
});

define([
  'atlas/lib/utility/Setter',
  'atlas/lib/Q',
  // Base class
  'atlas/material/Color',
  'atlas/material/CheckPattern',
  'atlas/model/Polygon',
  'atlas/model/GeoPoint',
  'atlas/model/Vertex',
  'atlas/util/AtlasMath',
  'atlas/util/Timers',
  'atlas-cesium/material/Color',
  'atlas-cesium/material/CheckPattern',
  'atlas-cesium/model/Handle',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Core/PolygonGeometry',
  'atlas-cesium/cesium/Source/Core/PolygonOutlineGeometry',
  'atlas-cesium/cesium/Source/Core/ColorGeometryInstanceAttribute',
  'atlas-cesium/cesium/Source/Core/VertexFormat',
  'atlas-cesium/cesium/Source/Core/Matrix3',
  'atlas-cesium/cesium/Source/Core/Matrix4',
  'atlas-cesium/cesium/Source/Core/Transforms',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  'atlas-cesium/cesium/Source/Scene/Material',
  'atlas-cesium/cesium/Source/Scene/PerInstanceColorAppearance',
  'atlas-cesium/cesium/Source/Scene/EllipsoidSurfaceAppearance'
], function(Setter, Q, ColorCore, CheckPatternCore, PolygonCore, GeoPoint, Vertex, AtlasMath,
            Timers, Color, CheckPattern, Handle, Cartesian3, GeometryInstance, PolygonGeometry,
            PolygonOutlineGeometry, ColorGeometryInstanceAttribute, VertexFormat, Matrix3, Matrix4,
            Transforms, Primitive, Material, PerInstanceColorAppearance,
            EllipsoidSurfaceAppearance) {

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

    /**
     * The model matrix applied after primitives are rendered. This is used to perform transient
     * transformations which are faster than rebuilding the primitives.
     * @type {Matrix4}
     */
    _modelMatrix: null,

    /**
     * The deferred promise for updating primitive styles, which is a asynchronous and should be
     * mutually exclusive.
     * @type {Deferred}
     */
    _updateStyleDf: null,

    /**
     * A copy of the original vertices which are used when constructing the primitives. The model
     * matrix is then applied, ensuring the final vertices of the primitives are equal to the actual
     * vertices.
     * @type {Array.<atlas.model.GeoPoint>}
     */
    _origVertices: null,

    /**
     * The original centroid before any translation transformations. Reset each time the translation
     * transformations are reset.
     * @type {atlas.model.GeoPoint}
     */
    _origCentroid: null,

    // -------------------------------------------
    // GETTERS AND SETTERS
    // -------------------------------------------

    // -------------------------------------------
    // CONSTRUCTION
    // -------------------------------------------

    /**
     * Builds the geometry and appearance data required to render the Polygon in
     * Cesium.
     */
    _build: function() {
      var style = this.getStyle();
      var fillMaterial = style.getFillMaterial();
      var borderMaterial = style.getFillMaterial();
      var isModelDirty = this.isDirty('entity') || this.isDirty('vertices') ||
          this.isDirty('model');
      var isStyleDirty = this.isDirty('style');
      var scene = this._renderManager.getScene();
      if (isModelDirty) {
        this._removePrimitives();
      }
      this._createGeometry();
      if (fillMaterial) {
        if ((isModelDirty || !this._primitive) && this._geometry) {
          if (isStyleDirty || !this._appearance) {
            this._appearance = new EllipsoidSurfaceAppearance({
              material: this._toCesiumMaterial(fillMaterial)
            });
          }
          this._primitive = new Primitive({
            geometryInstances: this._geometry,
            appearance: this._appearance
          });
        } else if (isStyleDirty && this._appearance) {
          this._appearance.material = this._toCesiumMaterial(fillMaterial);
        }
      }
      if (borderMaterial) {
        if ((isModelDirty || !this._outlinePrimitive) && this._outlineGeometry) {
          var maxWidth = scene.maximumAliasedLineWidth;
          var minWidth = Math.min(2, maxWidth);
          var lineWidth = Setter.range(style.getBorderWidth(), minWidth, maxWidth);
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
                lineWidth: lineWidth
              }
            })
          });
        } else if (isStyleDirty && this._outlinePrimitive) {
          this._updateStyleDf && this._updateStyleDf.reject();
          this._updateStyleDf = this._whenPrimitiveReady(this._outlinePrimitive);
          this._updateStyleDf.promise.then(function() {
            var outlineGeometryAtts =
                this._outlinePrimitive.getGeometryInstanceAttributes(this._outlineGeometry.id);
            var borderColor = this._getBorderColor();
            if (borderColor) {
              outlineGeometryAtts.color = ColorGeometryInstanceAttribute.toValue(borderColor);
            }
            this._updateStyleDf = null;
          }.bind(this));
        }
      }
      this._addPrimitives();
      var modelMatrix = this._modelMatrix;
      if ((isModelDirty || this.isDirty('modelMatrix')) && modelMatrix) {
        // If the model has been redrawn, then we don't want to apply the existing matrix, since
        // the transformations have been applied to the underlying vertices and transforming them
        // again with the matrix would apply the transformation twice. We use the model matrix only
        // for transformations between rebuilds for performance, so it's safe to remove it.
        [this._primitive, this._outlinePrimitive].forEach(function(primitive) {
          primitive && this._updateModelMatrix(primitive, modelMatrix);
        }, this);
      }
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
      if (this._primitive) {
        this._primitive.show = false;
        this._primitive = null;
        this._geometry = null;
      }
      if (this._outlinePrimitive) {
        this._outlinePrimitive.show = false;
        this._outlinePrimitive = null;
        this._outlineGeometry = null;
      }
    },

    /**
     * Creates the geometry data as required.
     * @private
     */
    _createGeometry: function() {
      var style = this.getStyle();
      var fillMaterial = style.getFillMaterial();
      var borderColor = this._getBorderColor();
      var geometryId = this.getId();
      var isModelDirty = this.isDirty('entity') || this.isDirty('vertices') ||
          this.isDirty('model');
      var shouldCreateGeometry = fillMaterial && (isModelDirty || !this._geometry);
      var shouldCreateOutlineGeometry = borderColor && (isModelDirty || !this._outlineGeometry);
      if (!shouldCreateGeometry && !shouldCreateOutlineGeometry) {
        return;
      }
      var vertices = this._initOrigVertices();
      if (isModelDirty || !this._cartesians || !this._minTerrainElevation) {
        if (vertices.length < 3) {
          return;
        }
        this._cartesians = this._renderManager.cartesianArrayFromGeoPointArray(vertices);
        this._minTerrainElevation = this._renderManager.getMinimumTerrainHeight(vertices);
      }
      // TODO(aramk) The zIndex is currently absolute, not relative to the parent or using bins.
      var elevation = this._minTerrainElevation + this._elevation +
          this._zIndex * this._zIndexOffset;
      var height = (this._showAsExtrusion ? this._height : 0);
      var holes = [];
      this._holes && this._holes.forEach(function(holeArray) {
        if (holeArray.length > 0) {
          var positions = this._renderManager.cartesianArrayFromGeoPointArray(holeArray);
          holes.push({positions: positions});
        }
      }, this);
      // Generate geometry data.
      var polygonHierarchy = {
        positions: this._cartesians,
        holes: holes
      };
      if (shouldCreateGeometry) {
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
      if (shouldCreateOutlineGeometry) {
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

    /**
     * @param {Primitive} primitive
     * @return {Q.Deferred} A deferred promise which is resolved when the given primitive is ready
     * for rendering or modifiying.
     */
    _whenPrimitiveReady: function(primitive) {
      return Timers.waitUntil(function() {
        return primitive.ready;
      });
    },

    /**
     * Updates the model matrix of the given primitive when it is ready to accept the change.
     * This operation is mutually exclusive and will cancel exisiting requests.
     * @param  {Primitive} primitive
     * @param  {Matrix4} modelMatrix
     * @return {Promise}
     */
    _updateModelMatrix: function(primitive, modelMatrix) {
      var df = primitive._updateModelMatrixDf;
      df && df.reject();
      df = primitive._updateModelMatrixDf = this._whenPrimitiveReady(primitive);
      df.promise.then(function() {
        primitive.modelMatrix = modelMatrix;
      });
      return df.promise;
    },

    // -------------------------------------------
    // MODIFIERS
    // -------------------------------------------

    // TODO(aramk) These methods are Cesium specific and can be shared across all Atlas-Cesium
    // subclasses of models - anything that uses a primitive. For this we need mixins to allow
    // inheriting these as well as their Atlas superclasses.

    translate: function(translation) {
      this._copyOrigVertices();
      var centroid = this.getCentroid();
      var target = centroid.translate(translation);
      var origCentroidDiff = target.subtract(this._origCentroid);
      var isTranslatedBeyondSensitivity = origCentroidDiff.longitude >= 1 ||
        origCentroidDiff.latitude >= 1;
      this._transformModelMatrix(this._calcTranslateMatrix(centroid, target));
      this._super(translation);
      if (isTranslatedBeyondSensitivity) {
        // Revert the model matrix and redraw the primitives at the new points to avoid an issue
        // where the original normal to the globe's surface is retained as the rotation when
        // translating, causing issues if the new normal is sufficiently different.
        this._resetModelMatrix();
        this._resetOrigVertices();
        this.setDirty('model');
        this._update();
      }
    },

    scale: function(scale) {
      this._copyOrigVertices();
      var scaleCartesian = this._renderManager.cartesianFromVertex(scale);
      var scaleMatrix = Matrix4.fromScale(scaleCartesian);
      this._transformModelMatrix(this._calcTransformOriginMatrix(scaleMatrix));
      this._super(scale);
    },

    rotate: function(rotation, centroid) {
      this._copyOrigVertices();
      centroid = centroid || this.getCentroid();
      this._transformModelMatrix(this._calcRotateMatrix(rotation, centroid));
      this._super(rotation);
    },

    /**
     * @param {atlas.model.GeoPoint} source
     * @param {atlas.model.GeoPoint} target
     * @returns {Matrix4} The transformation matrix for moving from the given source to the given
     * target.
     * @private
     */
    _calcTranslateMatrix: function(source, target) {
      var sourceCartesian = this._renderManager.cartesianFromGeoPoint(source);
      var targetCartesian = this._renderManager.cartesianFromGeoPoint(target);
      var diffCartesian = Cartesian3.subtract(targetCartesian, sourceCartesian, new Cartesian3());
      return Matrix4.fromTranslation(diffCartesian);
    },

    /**
     * @param {atlas.model.Vertex} rotation
     * @param {atlas.model.GeoPoint} [centroid] The point around which to perform the
     * transformation.
     * @returns {Matrix4} The transformation matrix needed to apply the given rotation around the
     * given point.
     * @private
     */
    _calcRotateMatrix: function(rotation, centroid) {
      return this._calcTransformOriginMatrix(this._calcRotationTranslationMatrix(rotation),
          centroid);
    },

    _calcRotationTranslationMatrix: function(rotation) {
      // TODO(aramk) Support rotation in all axes.
      var zRotation = 360 - rotation.z;
      return Matrix4.fromRotationTranslation(
          Matrix3.fromRotationZ(AtlasMath.toRadians(zRotation)), new Cartesian3());
    },

    /**
     * Used to apply a transformation matrix to the given entity relative to its position, scale and
     * rotation after construction.
     * @param {Matrix4} matrix
     * @param {atlas.model.GeoPoint} [centroid] The point to use as the starting point for the
     * transformation.
     * @returns {Matrix4} The transformation matrix for applying the given matrix as a
     * transformation after normalising the existing position, scale and rotation to the origin at
     * the centre of the earth and back.
     * @private
     */
    _calcTransformOriginMatrix: function(matrix, centroid) {
      centroid = centroid || this.getCentroid();
      var centroidCartesian = this._renderManager.cartesianFromGeoPoint(centroid);
      // This transforms from the centre of the earth to the surface at the given position and
      // aligns the east and north as the x and y axes. The z is the vector from the centre of the
      // earth to the surface location and points upward from the earth - it's the normal vector
      // for the surface of the earth at that location.
      var originMatrix = Transforms.eastNorthUpToFixedFrame(centroidCartesian);
      // Since our existing position after construction is NOT the centre of the earth, we must
      // reverse the above transformation and move the geometry back to the origin, apply the
      // given matrix transformation, then apply the transformation again.
      var invOriginMatrix = Matrix4.inverseTransformation(originMatrix, Matrix4.IDENTITY.clone());
      var modelMatrix = Matrix4.multiply(
          matrix,
          invOriginMatrix,
          Matrix4.IDENTITY.clone());
      return Matrix4.multiply(originMatrix, modelMatrix, modelMatrix);
    },

    /**
     * @param {Matrix4} modelMatrix
     * @private
     */
    _setModelMatrix: function(modelMatrix) {
      this._modelMatrix = modelMatrix;
      this.setDirty('modelMatrix');
    },

    /**
     * @returns {Matrix4}
     * @private
     */
    _getModelMatrix: function() {
      // Avoids storing data that may not be used for all polygons.
      if (!this._modelMatrix) {
        this._modelMatrix = Matrix4.IDENTITY.clone();
      }
      return this._modelMatrix;
    },

    _resetModelMatrix: function() {
      this._modelMatrix = null;
      this._getModelMatrix();
    },

    /**
     * Applies the given transformation matrix to the existing model matrix.
     * @param {Matrix4} modelMatrix
     * @private
     */
    _transformModelMatrix: function(modelMatrix) {
      var oldModelMatrix = this._getModelMatrix();
      var newModelMatrix = Matrix4.multiply(modelMatrix, oldModelMatrix, Matrix4.IDENTITY.clone());
      this._setModelMatrix(newModelMatrix);
    },

    _onTransform: function() {
      // Avoids superclass from setting "model" to dirty when transforming since we use the matrix
      // transformations in Cesium.
      this._invalidateGeometry();
      this.setDirty('modelMatrix');
      this._update();
    },

    _updateVisibility: function(visible) {
      var style = this.getStyle();
      if (this._primitive) this._primitive.show = !!(visible && style.getFillMaterial());
      if (this._outlinePrimitive) this._outlinePrimitive.show =
          !!(visible && style.getBorderMaterial());
    },

    /**
     * Function to permanently remove the Polygon from the scene (vs. hiding it).
     */
    remove: function() {
      this._super();
      this._removePrimitives();
    },

    /**
     * Sets the {@link #._origVertices} as a reference to the current vertices. This should be
     * called before any code that uses it.
     */
    _initOrigVertices: function() {
      if (!this._origVertices) { this._origVertices = this._vertices };
      if (!this._origCentroid) { this._origCentroid = this.getCentroid() };
      return this._origVertices;
    },

    /**
     * Sets the {@link #._origVertices} as a copy of the existing vertices. This should be called
     * before any changes on the vertices take place.
     */
    _copyOrigVertices: function() {
      this._initOrigVertices();
      if (this._origVertices === this._vertices) {
        this._origVertices = Setter.cloneDeep(this._vertices);
      }
      return this._origVertices;
    },

    _resetOrigVertices: function() {
      this._origVertices = this._origCentroid = null;
      this._initOrigVertices();
    },

    _toCesiumMaterial: function(material) {
      // Temporary solution until we have factories.
      if (material instanceof ColorCore) {
        material.toCesiumColor = Color.prototype.toCesiumColor.bind(material);
        return Color.prototype.toCesiumMaterial.apply(material);
      } else if (material instanceof CheckPatternCore) {
        material.color1 = new Color(material.color1);
        material.color2 = new Color(material.color2);
        return CheckPattern.prototype.toCesiumMaterial.apply(material);
      } else {
        throw new Error('Cannot create Cesium Material.');
      }
    },

    _getBorderColor: function() {
      var style = this.getStyle();
      var material = style.getBorderMaterial();
      if (material instanceof ColorCore) {
        return Color.prototype.toCesiumColor.bind(material)();
      } else {
        // Only color is supported for polyline borders at the moment. Reject all other materials.
        throw new Error('Only Color material is supported for Polygon border.');
      }
    }

  });

  return Polygon;
});

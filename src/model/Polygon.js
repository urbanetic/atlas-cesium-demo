define([
  // Base class
  'atlas/model/Polygon',
  'atlas/model/GeoPoint',
  'atlas/model/Vertex',
  'atlas/util/AtlasMath',
  'atlas-cesium/model/Handle',
  'atlas-cesium/model/Style',
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
], function(PolygonCore, GeoPoint, Vertex, AtlasMath, Handle, Style, Cartesian3, GeometryInstance,
            PolygonGeometry, PolygonOutlineGeometry, ColorGeometryInstanceAttribute, VertexFormat,
            Matrix3, Matrix4, Transforms, Primitive, Material, PerInstanceColorAppearance,
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
     * The ID of the handler used for updating styles. Only one handler should be running. Any
     * existing handler should be cancelled.
     * @type {Number}
     */
    _updateStyleHandle: null,

    // TODO(aramk) Add these to geo entity.

    _rotation: null,

    _scale: 1,

    _modelMatrix: null,

    _init: function() {
      this._rotation = new Vertex(0, 0, 0);
      this._super.apply(this, arguments);
    },

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
      if (fillColor) {
        if ((isModelDirty || !this._primitive) && this._geometry) {
          if (isStyleDirty || !this._appearance) {
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
          this._primitive = new Primitive({
            geometryInstances: this._geometry,
            appearance: this._appearance
          });
        } else if (isStyleDirty && this._appearance) {
          this._appearance.material.uniforms.color = fillColor;
        }
      }
      if (borderColor) {
        if ((isModelDirty || !this._outlinePrimitive) && this._outlineGeometry) {
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
      // Update model matrix after primitives are visible.
      if (this.isDirty('modelMatrix')) {
        var modelMatrix = this._getModelMatrix();
        if (this._primitive) this._primitive.modelMatrix = modelMatrix;
        if (this._outlinePrimitive) this._outlinePrimitive.modelMatrix = modelMatrix;
      }
      this._addPrimitives();
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
      // Generate new cartesians if the vertices have changed.
      if (isModelDirty || !this._cartesians || !this._minTerrainElevation) {
        if (this._vertices.length === 0) {
          return;
        }
        this._cartesians = this._renderManager.cartesianArrayFromGeoPointArray(this._vertices);
        this._minTerrainElevation = this._renderManager.getMinimumTerrainHeight(this._vertices);
      }
      var shouldCreateGeometry = fillColor && (isModelDirty || !this._geometry);
      var shouldCreateOutlineGeometry = borderColor && (isModelDirty || !this._outlineGeometry);
      if (!shouldCreateGeometry && !shouldCreateOutlineGeometry) {
        return;
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

//    _getModelMatrix: function() {
//      // Construct rotation and translation transformation matrix.
//      // TODO(bpstudds): Only rotation about the vertical axis is implemented.
//      // The matrix to apply transformations on.
//      var modelMatrix = Matrix4.IDENTITY.clone();
//      var centroid = this.getCentroid();
////      var negCentroid = new GeoPoint(0, 0, 0).subtract(centroid);
////      var negLocationCartesian = this._renderManager.cartesianFromGeoPoint(negCentroid);
////      var locationCartesian = this._renderManager.cartesianFromGeoPoint(centroid);
////      var negTranslation = Matrix4.fromTranslation(negLocationCartesian);
////      var translation = Matrix4.fromTranslation(locationCartesian);
////      // Apply rotation, translation and scale transformations.
////      var rotationTranslation = Matrix4.fromRotationTranslation(
////          // Input angle must be in radians.
////          Matrix3.fromRotationZ(AtlasMath.toRadians(this._rotation.z)), new Cartesian3(0, 0, 0));
//
//      var target = centroid.subtract(new GeoPoint(0.001, 0.001, 0));
//      var centroidCartesian = this._renderManager.cartesianFromGeoPoint(centroid);
//      var targetCartesian = this._renderManager.cartesianFromGeoPoint(target);
//      var diffCartesian = Cartesian3.subtract(targetCartesian, centroidCartesian, new Cartesian3());
//      var translation = Matrix4.fromTranslation(diffCartesian);
//
////      var negCentroid = new GeoPoint(0, 0, 0);
////      var negLocationCartesian = this._renderManager.cartesianFromGeoPoint(negCentroid);
////      var negTranslation = Matrix4.fromTranslation(negLocationCartesian);
////      negTranslation.x = 0;
//
//      Matrix4.multiply(translation, modelMatrix, modelMatrix);
//
////      Matrix4.multiply(negTranslation, translation, modelMatrix);
//
//      // TODO(aramk) Use optimised multiply methods.
////      Matrix4.multiply(negTranslation, rotationTranslation, modelMatrix);
////      Matrix4.multiply(modelMatrix, translation, modelMatrix);
//
//      return modelMatrix;
//
////      return Transforms.eastNorthUpToFixedFrame(locationCartesian);
//
////      Matrix4.multiply(Transforms.eastNorthUpToFixedFrame(locationCartesian), rotationTranslation,
////          modelMatrix);
////      if (this._scale !== 1) {
////        // TODO(aramk) Breaks
////        Matrix4.multiplyByScale(modelMatrix, this._scale, modelMatrix);
////      }
////      return modelMatrix;
//    },

    // -------------------------------------------
    // MODIFIERS
    // -------------------------------------------

    // TODO(aramk) Add these methods to GeoEntity and refactor Ellipse etc.

    translate: function(translation) {
      // TODO(aramk) Modify the input vertices as well to ensure getters still work and centroid
      // is updated. Write a test for that.
      var centroid = this.getCentroid();
      var target = centroid.translate(translation);
      this._transformModelMatrix(this._translateMatrix(centroid, target));
      this._super(translation);
      this._invalidateVertices();
    },

    //    scale: function (scale) {
//      this.setScale(this.getScale() * scale);
//      this._super(scale);
//      this._invalidateVertices();
//    },
//
//    setScale: function (scale) {
//      this._scale = scale;
//      // TODO
//    },
//
//    getScale: function() {
//      return this._scale;
//    },

    _translateMatrix: function(source, target) {
      var sourceCartesian = this._renderManager.cartesianFromGeoPoint(source);
      var targetCartesian = this._renderManager.cartesianFromGeoPoint(target);
      var diffCartesian = Cartesian3.subtract(targetCartesian, sourceCartesian, new Cartesian3());
      return Matrix4.fromTranslation(diffCartesian);
    },

    rotate: function(rotation) {
      // Matrix rotation transformations must be performed at the origin, so we translate it there,
      // then rotate, then translate it back.
      this._rotation = this.getRotation().translate(rotation);

      var centroid = this.getCentroid();
      var centroidCartesian = this._renderManager.cartesianFromGeoPoint(centroid);
      var negCentroidCartesian = Cartesian3.negate(centroidCartesian, new Cartesian3());
      var negTranslation = Matrix4.fromTranslation(negCentroidCartesian);
      var posTranslation = Matrix4.fromTranslation(centroidCartesian);

      // TODO(aramk) Support rotation in all axes.
//      var rotationTransform = Matrix4.fromRotationTranslation(
//          Matrix3.fromRotationZ(AtlasMath.toRadians(this._rotation.z)), new Cartesian3());
//      var modelMatrix = Matrix4.multiply(rotationTransform, negTranslation, Matrix4.IDENTITY.clone());
//      modelMatrix = Matrix4.multiply(posTranslation, modelMatrix, modelMatrix);
//      this._transformModelMatrix(modelMatrix);

//      var rotMatrix = Matrix3.fromRotationZ(AtlasMath.toRadians(this._rotation.z));
//      var modelMatrix = Matrix4.multiply(
//          Matrix4.fromRotationTranslation(rotMatrix, new Cartesian3()),
//          Transforms.northEastDownToFixedFrame(centroidCartesian),
//          Matrix4.IDENTITY.clone());
//      modelMatrix = Matrix4.multiply(
//          Transforms.eastNorthUpToFixedFrame(centroidCartesian),
//          modelMatrix, modelMatrix);


      var rotMatrix = Matrix3.fromRotationZ(AtlasMath.toRadians(this._rotation.z));
      var originMatrix = Transforms.eastNorthUpToFixedFrame(centroidCartesian);
      var invOriginMatrix = Matrix4.inverseTransformation(originMatrix, Matrix4.IDENTITY.clone());
      var modelMatrix = Matrix4.multiply(
          Matrix4.fromRotationTranslation(rotMatrix, new Cartesian3()),
          invOriginMatrix,
          Matrix4.IDENTITY.clone());
      modelMatrix = Matrix4.multiply(
          originMatrix,
          modelMatrix, modelMatrix);


//      var modelMatrix = Matrix4.multiply(
//          Transforms.eastNorthUpToFixedFrame(centroidCartesian),
//          Matrix4.fromRotationTranslation(rotMatrix, new Cartesian3()),
//          Matrix4.IDENTITY.clone());

      // TODO(aramk) Can we transform by multiplying to the existing?
//      this._setModelMatrix(modelMatrix)
      this._transformModelMatrix(modelMatrix);

      this._super(rotation);
      this._invalidateVertices();
    },

    setRotation: function(rotation) {
      var diff = rotation.subtract(this.getRotation());
      this.rotate(diff);
    },

    getRotation: function() {
      return this._rotation;
    },

    _setModelMatrix: function(modelMatrix) {
      this._modelMatrix = modelMatrix;
      this.setDirty('modelMatrix');
    },

    _getModelMatrix: function() {
      // Avoids storing data that may not be used for all polygons.
      if (!this._modelMatrix) {
        this._modelMatrix = Matrix4.IDENTITY.clone();
      }
      return this._modelMatrix;
    },

    _transformModelMatrix: function(modelMatrix) {
      var oldModelMatrix = this._getModelMatrix();
      var newModelMatrix = Matrix4.multiply(oldModelMatrix, modelMatrix, Matrix4.IDENTITY.clone());
      this._setModelMatrix(newModelMatrix);
    },

    _onTransform: function() {
      // Avoid setting "model" to dirty when transforming since we use the matrix transformations in
      // Cesium.
      this.setDirty('modelMatrix');
      this._update();
    },

    _updateVisibility: function(visible) {
      var cesiumColors = this._getCesiumColors();
      var fillColor = cesiumColors.fill;
      var borderColor = cesiumColors.border;
      if (this._primitive) this._primitive.show = visible && fillColor;
      if (this._outlinePrimitive) this._outlinePrimitive.show = visible && borderColor;
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

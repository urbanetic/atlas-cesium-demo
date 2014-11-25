define([
  'atlas/lib/Q',
  'atlas/model/GeoPoint',
  'atlas/model/Vertex',
  'atlas/util/AtlasMath',
  'atlas/util/WKT',
  'atlas/util/ConvexHullFactory',
  // Cesium includes
  'atlas-cesium/cesium/Source/Core/BoundingSphere',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
  'atlas-cesium/cesium/Source/Core/Color',
  'atlas-cesium/cesium/Source/Core/ColorGeometryInstanceAttribute',
  'atlas-cesium/cesium/Source/Core/ComponentDatatype',
  'atlas-cesium/cesium/Source/Core/Geometry',
  'atlas-cesium/cesium/Source/Core/GeometryAttribute',
  'atlas-cesium/cesium/Source/Core/GeometryAttributes',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Core/GeometryPipeline',
  'atlas-cesium/cesium/Source/Core/Matrix3',
  'atlas-cesium/cesium/Source/Core/Matrix4',
  'atlas-cesium/cesium/Source/Core/PrimitiveType',
  'atlas-cesium/cesium/Source/Core/Transforms',
  'atlas-cesium/cesium/Source/Scene/PerInstanceColorAppearance',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  'atlas-cesium/model/Colour',
  //Base class.
  'atlas/model/Mesh'
], function(Q, GeoPoint, Vertex, AtlasMath, WKT, ConvexHullFactory, BoundingSphere,
            Cartesian3, CesiumColor, ColorGeometryInstanceAttribute, ComponentDatatype, Geometry,
            GeometryAttribute, GeometryAttributes, GeometryInstance, GeometryPipeline, Matrix3,
            Matrix4, PrimitiveType, Transforms, PerInstanceColorAppearance, Primitive, Colour,
            MeshCore) {

  /**
   * @classdesc A Mesh represents a 3D renderable object in atlas.
   * @param {String} id - The ID of the Mesh.
   * @param {String} meshData - The data required to render the Mesh.
   * @param {Array.<Number>} meshData.geoLocation - The location of the Mesh in an
   * [latitude, longitude, elevation] formatted array. Unique positions need to be defined for every
   * triangle vertex to ensure shading works correctly.
   * @param {Array.<Number>} meshData.positions - A 1D array of position data, every 3 elements
   * forming a vertex, ie a (x, y, z) coordinate tuple in model space.
   * @param {Array.<Number>} meshData.triangles - A 1D array of the triangles forming the mesh.
   * Every 3 elements forming a new triangle with counter-clockwise winding order.
   * @param {Array.<Number>} [meshData.normals] - CURRENTLY NOT USED. A 1D array of normals for
   * each vertex in the triangles array. Every 3 elements form an (x, y, z) vector tuple.
   * @param {Array.<Number>} [meshData.color] - The uniform colour of the Mesh, given as a
   * [red, green, blue, alpha] formatted array.
   * @param {Array.<Number>} [meshData.scale] - The scale of the Mesh.
   * @param {Array.<Number>} [meshData.rotation] - The rotation of the Mesh.
   * @param {Object} args - Required and optional arguments to construct the Mesh object.
   * @param {String} args.id - The ID of the GeoEntity. (Optional if both <code>id</code> and
   * <code>args</code> are provided as arguments)
   * @param {atlas.render.RenderManager} args.renderManager - The RenderManager object responsible
   * for the GeoEntity.
   * @param {atlas.events.EventManager} args.eventManager - The EventManager object responsible for
   * the Event system.
   * @param {atlas.events.EventTarget} [args.parent] - The parent EventTarget object of the
   * GeoEntity.
   *
   * @see {@link atlas.model.Mesh}
   * @see {@link atlas.model.GeoEntity}
   *
   * @class atlas-cesium.model.Mesh
   * @extends atlas.model.Mesh
   */
  var Mesh = MeshCore.extend(/** @lends atlas-cesium.model.Mesh# */ {

    /**
     * The Cesium Primitive object.
     * @type {Primitive}
     * @private
     */
    _primitive: null,

    /**
     * The model matrix applied after primitives are rendered. This is used to perform transient
     * transformations which are faster than rebuilding the primitives.
     * @type {Matrix4}
     */
    _modelMatrix: null,

    /**
     * The original centroid before any transformations.
     * @type {atlas.model.GeoPoint}
     */
    _origCentroid: null,

    /**
     * Whether the model matrix has been fully initialiased and the model is ready for rendering.
     * @type {Boolean}
     */
    _modelMatrixReady: null,

    /**
     * The deferred promise for updating primitive styles.
     * @type {Deferred}
     */
    _updateStyleDf: null,

    _init: function () {
      this._modelMatrixReady = false;
      this._super.apply(this, arguments);
      // TODO(aramk): This overwrites all the matrix transformations in subclass.
      this._setModelMatrix(this._initModelMatrix());
      this._modelMatrixReady = true;
    },

    _updateVisibility: function(visible) {
      if (this._primitive) this._primitive.show = visible;
    },

    /**
     * Builds the geometry and appearance data required to render the Polygon in
     * Cesium.
     */
    _build: function() {
      var isModelDirty = this.isDirty('entity') || this.isDirty('vertices') ||
          this.isDirty('model');
      if (!this._primitive || isModelDirty) {
        if (this._primitive) {
          this._renderManager.getPrimitives().remove(this._primitive);
        }
        this._primitive = this._createPrimitive();
        this._renderManager.getPrimitives().add(this._primitive);
      } else if (this.isDirty('style')) {
        this._updateAppearance();
      }

      // Update model matrix after primitives are visible and ready.
      var modelMatrix = this._modelMatrix;
      // var modelMatrix = this._initModelMatrix();
      // console.log('expected', modelMatrix);
      // console.log('  actual', this._modelMatrix);

      if ((isModelDirty || this.isDirty('modelMatrix')) && modelMatrix) {
        // If the model has been redrawn, then we don't want to apply the existing matrix, since
        // the transformations have been applied to the underlying vertices and transforming them
        // again with the matrix would apply the transformation twice. We use the model matrix only
        // for transformations between rebuilds for performance, so it's safe to remove it.
        // if (isModelDirty) {
        //   modelMatrix = this._calcRotateMatrix(this.getRotation());
        //   this._setModelMatrix(modelMatrix);
        // }
        [this._primitive/*, this._outlinePrimitive*/].forEach(function(primitive) {
          if (primitive) {
            this._whenPrimitiveReady(primitive).promise.then(function() {
              primitive.modelMatrix = modelMatrix;
            });
          }
        }, this);
      }
    },

    /**
     * Creates the Cesium primitive object required to render the Mesh.
     * The Primitive object contains data to transform the Mesh from model space to
     * world space, as well as controlling the appearance of the Mesh.
     * @returns {Primitive}
     * @private
     */
    _createPrimitive: function() {
      var thePrimitive,
          geometry = this._createGeometry(),
          color = ColorGeometryInstanceAttribute.fromColor(this._style.getFillColour()),
          instance = new GeometryInstance({
            id: this.getId(),
            geometry: geometry,
            attributes: {
              color: color
            }
          });

      // TODO(bpstudds): Work out how to get MaterialAppearance working.
      thePrimitive = new Primitive({
        geometryInstances: instance,
        appearance: new PerInstanceColorAppearance({
          flat: false,
          translucent: false
        }),
        debugShowBoundingVolume: false
      });
      return thePrimitive;
    },

    /**
     * Updates the geometry data as required.
     * @returns {GeometryInstance}
     * @private
     */
    _createGeometry: function() {
      // Generate new cartesians if the vertices have changed.
      if (this.isDirty('entity') || this.isDirty('vertices') || this.isDirty('model')) {
        var attributes = new GeometryAttributes({
          position: new GeometryAttribute({
            componentDatatype: ComponentDatatype.DOUBLE,
            componentsPerAttribute: 3,
            values: this._positions
          })
        });
        var geometry = new Geometry({
          attributes: attributes,
          indices: this._indices,
          primitiveType: PrimitiveType.TRIANGLES,
          boundingSphere: BoundingSphere.fromVertices(this._positions)
        });
        // Force compute normals to fix abnormal normals from winding orders.
        // TODO(Brandon) Gets server to calculate correct normals.
        geometry = GeometryPipeline.computeNormal(geometry);
        this._geometry = geometry;
      }
      return this._geometry;
    },

    _initModelMatrix: function() {
      // TODO(aramk) Only update if necessary.
      if (!(this._rotation instanceof Vertex)) {
        this._rotation = new Vertex(0, 0, 0);
      }
      // Construct rotation and translation transformation matrix.
      // TODO(bpstudds): Only rotation about the vertical axis is implemented.
      var modelMatrix = Matrix4.IDENTITY.clone();
      if (this.isDirty('entity') || this.isDirty('model')) {
        // The matrix to apply transformations on.
        // Apply rotation, translation and scale transformations.
        var rotationTranslation = Matrix4.fromRotationTranslation(
            // Input angle must be in radians.
            Matrix3.fromRotationZ(AtlasMath.toRadians(this._rotation.z)),
            new Cartesian3(0, 0, 0));
        var locationCartesian = this._renderManager.cartesianFromGeoPoint(this._geoLocation);
        Matrix4.multiply(Transforms.eastNorthUpToFixedFrame(locationCartesian), rotationTranslation,
            modelMatrix);
        Matrix4.multiplyByScale(modelMatrix, this._scale, modelMatrix);
        // this._modelMatrix = modelMatrix;
      }
      return modelMatrix;
    },

    /**
     * Updates the appearance data.
     * @private
     */
    _updateAppearance: function() {
      if (this.isDirty('entity') || this.isDirty('style')) {
        this._updateStyleDf && this._updateStyleDf.reject();
        this._updateStyleDf = this._whenPrimitiveReady(this._primitive);
        this._updateStyleDf.promise.then(function() {
          if (!this._appearance) {
            this._appearance = this._primitive.getGeometryInstanceAttributes(this.getId());
          }
          this._appearance.color =
            ColorGeometryInstanceAttribute.toValue(Colour.toCesiumColor(this._style.getFillColour()));
          this._updateStyleDf = null;
        }.bind(this));
      }
    },

    _whenPrimitiveReady: function(primitive) {
      var df = new Q.defer();
      if (primitive.ready) {
        df.resolve();
      } else {
        var timeout = 60000;
        var freq = 200;
        var totalTime = 0;
        var handle = setInterval(function() {
          if (totalTime >= timeout || primitive.ready) {
            clearInterval(handle);
            df.resolve();
          }
          totalTime += freq;
        }, freq);
      }
      return df;
    },

    /**
     * @returns {Array.<atlas.model.GeoPoint>} The final vertices of this Mesh after all
     * transformations.
     * @private
     */
    _calcVertices: function() {
      // Remove elevation from positions array.
      var cartesians = [];
      // Uses x,y coordinates from the 1D array of positions.
      for (var i = 0; i < this._positions.length; i += 3) {
        cartesians.push(new Cartesian3(this._positions[i], this._positions[i + 1]));
      }
      var modelMatrix = this._getModelMatrix();
      return cartesians.map(function(position) {
        var transformedCartesian = Matrix4.multiplyByPoint(modelMatrix, position, new Cartesian3());
        return this._renderManager.geoPointFromCartesian(transformedCartesian);
      }, this);
    },

    /**
     * @returns {Array.<atlas.model.GeoPoint>} The vertices forming a footprint for this mesh
     * constructed into a convex hull.
     * @private
     */
    _getFootprintVertices: function() {
      return ConvexHullFactory.getInstance().fromVertices(this._calcVertices());
    },

    // TODO(aramk) Add support for this in Atlas - it needs matrix functions from _calcVertices
    // for now.
    getOpenLayersGeometry: function() {
      var vertices = this._getFootprintVertices();
      return WKT.getInstance().openLayersPolygonFromGeoPoints(vertices);
    },

    /**
     * Function to permanently remove the Mesh from the scene (vs. hiding it).
     */
    remove: function() {
      this._super();
      this._primitive && this._renderManager.getPrimitives().remove(this._primitive);
    },

    // -------------------------------------------
    // MODIFIERS
    // -------------------------------------------

    // TODO(aramk) These methods are Cesium specific and can be shared across all Atlas-Cesium
    // subclasses of models - anything that uses a primitive. For this we need mixins to allow
    // inheriting these as well as their Atlas superclasses.

    translate: function(translation) {
      var centroid = this.getCentroid();
      var target = centroid.translate(translation);
      this._calcTranslateMatrix(this._translateMatrix(centroid, target));
      this._super(translation);
      // Ignore the intitial translation which centres the mesh at the given geoLocation.
      if (this._modelMatrixReady) {
        if (!this._origCentroid) {
          this._origCentroid = centroid;
        }
        var origCentroidDiff = target.subtract(this._origCentroid);
        var isTranslatedBeyondSensitivity = origCentroidDiff.longitude >= 1 ||
          origCentroidDiff.latitude >= 1;
        if (isTranslatedBeyondSensitivity) {
          // Revert the model matrix and redraw the primitives at the new points to avoid an issue
          // where the original normal to the globe's surface is retained as the rotation when
          // translating, causing issues if the new normal is sufficiently different.
          this.setDirty('model');
          // NOTE: geoLocation is moved as well to ensure that the matrix transformation necessary
          // for translation is minimal, reducing the issue described above.
          var centroidGeoLocationDiff = this._geoLocation.subtract(centroid);
          this._geoLocation = this._geoLocation.translate(origCentroidDiff);
          this._resetModelMatrix();
          this._origCentroid = null;
          this._update();
        }
      }
    },

    scale: function(scale) {
      var scaleCartesian = this._renderManager.cartesianFromVertex(scale);
      var scaleMatrix = Matrix4.fromScale(scaleCartesian);
      this._calcTranslateMatrix(this._calcTransformOriginMatrix(scaleMatrix));
      this._super(scale);
    },

    rotate: function(rotation, centroid) {
      centroid = centroid || this.getCentroid();
      this._calcTranslateMatrix(this._calcRotateMatrix(rotation, centroid));
      this._super(rotation);
    },

    /**
     * Applies the given transformation matrix to the existing model matrix.
     * @param {Matrix4} modelMatrix
     * @private
     */
    _calcTranslateMatrix: function(modelMatrix) {
      var oldModelMatrix = this._getModelMatrix();
      // Matrix4.IDENTITY is a reference to an immutable identity matrix so we need to clone it.
      var newModelMatrix = Matrix4.multiply(modelMatrix, oldModelMatrix, Matrix4.IDENTITY.clone());
      this._setModelMatrix(newModelMatrix);
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
      // TODO(aramk) Support rotation in all axes.
      var rotMatrix = Matrix4.fromRotationTranslation(
          Matrix3.fromRotationZ(AtlasMath.toRadians(rotation.z)), new Cartesian3());
      return this._calcTransformOriginMatrix(rotMatrix, centroid);
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
      this._setModelMatrix(this._initModelMatrix());
    },

    /**
     * @param {atlas.model.GeoPoint} source
     * @param {atlas.model.GeoPoint} target
     * @returns {Matrix4} The transformation matrix for moving from the given source to the given
     * target.
     * @private
     */
    _translateMatrix: function(source, target) {
      var sourceCartesian = this._renderManager.cartesianFromGeoPoint(source);
      var targetCartesian = this._renderManager.cartesianFromGeoPoint(target);
      var diffCartesian = Cartesian3.subtract(targetCartesian, sourceCartesian, new Cartesian3());
      return Matrix4.fromTranslation(diffCartesian);
    },

    _onTransform: function() {
      // Avoid setting "model" to dirty when transforming since we use the matrix transformations in
      // Cesium.
      this.setDirty('modelMatrix');
      this._invalidateGeometry();
      this._update();
    },

  });

  return Mesh;
});


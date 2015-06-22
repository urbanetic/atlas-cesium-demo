define([
  'atlas/lib/Q',
  'atlas/material/Color',
  'atlas/model/GeoPoint',
  'atlas/model/Vertex',
  'atlas/util/AtlasMath',
  'atlas/util/WKT',
  'atlas/util/ConvexHullFactory',
  'atlas/util/Timers',
  // Cesium includes
  'atlas-cesium/cesium/Source/Core/BoundingSphere',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
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
  'atlas-cesium/material/Color',
  //Base class.
  'atlas/model/Mesh'
], function(Q, ColorCore, GeoPoint, Vertex, AtlasMath, WKT, ConvexHullFactory, Timers,
            BoundingSphere, Cartesian3, ColorGeometryInstanceAttribute,
            ComponentDatatype, Geometry, GeometryAttribute, GeometryAttributes, GeometryInstance,
            GeometryPipeline, Matrix3, Matrix4, PrimitiveType, Transforms,
            PerInstanceColorAppearance, Primitive, Color, MeshCore) {

  /**
   * @classdesc A Mesh represents a 3D renderable object in atlas.
   * @param {String} id - The ID of the Mesh.
   * @param {String} meshData - The data required to render the Mesh.
   * @param {Array.<Number>} meshData.geoLocation - The location of the Mesh in an
   * [latitude, longitude, elevation] formatted array. Unique positions need to be defined for every
   * triangle vertex to ensure shading works correctly.
   * @param {Array.<Number>} [meshData.positions] - A 1D array of position data, every 3 elements
   * forming a vertex, ie a (x, y, z) coordinate tuple in model space.
   * @param {Array.<Number>} [meshData.triangles] - A 1D array of the triangles forming the mesh.
   * Every 3 elements forming a new triangle with counter-clockwise winding order.
   * @param {Array.<Number>} [meshData.normals] - CURRENTLY NOT USED. A 1D array of normals for
   * each vertex in the triangles array. Every 3 elements form an (x, y, z) vector tuple.
   * @param {Array.<Number>} [meshData.color] - The uniform color of the Mesh, given as a
   * [red, green, blue, alpha] formatted array.
   * @param {Number} [meshData.uniformScale] - The uniform scale of the Mesh.
   * @param {atlas.model.Vertex} [meshData.scale] - The non-uniform scale of the Mesh.
   * @param {Array.<Number>} [meshData.rotation=Matrix.IDENTITY] - The rotation of the Mesh.
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
     * The original centroid before any translation transformations. Reset each time the translation
     * transformations are reset.
     * @type {atlas.model.GeoPoint}
     */
    _origCentroid: null,

    /**
     * The deferred promise for updating primitive styles, which is a asynchronous and should be
     * mutually exclusive.
     * @type {Deferred}
     */
    _updateStyleDf: null,

    _updateVisibility: function(visible) {
      if (this._primitive) this._primitive.show = visible;
    },

    /**
     * Builds the geometry and appearance data required to render.
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
      var modelMatrix = this._getModelMatrix();
      if ((isModelDirty || this.isDirty('modelMatrix')) && modelMatrix) {
        this._primitive && this._updateModelMatrix(this._primitive, modelMatrix);
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
      var thePrimitive;
      var geometry = this._createGeometry();
      var color = ColorGeometryInstanceAttribute.fromColor(this._getFillColor());
      var instance = new GeometryInstance({
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
          // TODO(aramk) If enabled this causes meshes with opaque colors to become transparent
          // where they overlap (from the camera's perspective). Try to update cesium to fix this.
          translucent: false
        }),
        allowPicking: this.isSelectable(),
        asynchronous: false
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

    /**
     * Initialises the Mesh's model matrix based on the current geoLocation, scale and rotation of
     * the Mesh.
     * @return {Matrix4} The initialised model matrix.
     */
    _initModelMatrix: function() {
      // Construct rotation and translation transformation matrix.
      // TODO(bpstudds): Only rotation about the vertical axis is implemented.
      var modelMatrix = Matrix4.IDENTITY.clone();
      if (this.isDirty('entity') || this.isDirty('model')) {
        // The matrix to apply transformations on.
        // Apply rotation, translation and scale transformations.
        var rotationTranslation = this._calcRotationTranslationMatrix(this.getRotation());
        var locationCartesian = this._renderManager.cartesianFromGeoPoint(this._geoLocation);
        Matrix4.multiply(Transforms.eastNorthUpToFixedFrame(locationCartesian), rotationTranslation,
            modelMatrix);
        Matrix4.multiplyByScale(modelMatrix, this.getScale(), modelMatrix);
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
              ColorGeometryInstanceAttribute.toValue(this._getFillColor());
          this._updateStyleDf = null;
        }.bind(this));
      }
    },

    /**
     * @param {Primitive} primitive
     * @return {Q.Deferred} A deferred promise which is resolved when the given primitive is ready
     *     for rendering or modifiying. This promise is rejected if the primitive is destroyed
     *     before it is ready.
     */
    _whenPrimitiveReady: function(primitive) {
      var df = Timers.waitUntil(function() {
        if (primitive.isDestroyed()) {
          df.reject('Primitive was destroyed.');
          return false;
        }
        return primitive.ready;
      });
      return df;
    },

    /**
     * Updates the model matrix of the given primitive when it is ready to accept the change.
     * This operation is mutually exclusive and will cancel existing requests.
     * @param {Primitive} primitive
     * @param {Matrix4} modelMatrix
     * @return {Promise}
     */
    _updateModelMatrix: function(primitive, modelMatrix) {
      var df = primitive._updateModelMatrixDf;
      df && df.reject();
      df = primitive._updateModelMatrixDf = this._whenPrimitiveReady(primitive);
      return df.promise.then(function() {
        primitive.modelMatrix = modelMatrix;
      });
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
    getOpenLayersGeometry: function(args) {
      var wkt = WKT.getInstance();
      var vertices = this._getFootprintVertices();
      if (args && args.utm) {
        vertices = vertices.map(function(point) {
          return point.toUtm().coord;
        });
        return wkt.openLayersPolygonFromVertices(vertices);
      } else {
        return wkt.openLayersPolygonFromGeoPoints(vertices);
      }
    },

    /**
     * Function to permanently remove the Mesh from the scene (vs. hiding it).
     */
    remove: function() {
      this._super();
      this._primitive && this._renderManager.getPrimitives().remove(this._primitive);
    },

    ready: function() {
      if (this._primitive) {
        return this._whenPrimitiveReady(this._primitive).promise;
      } else {
        return Q.reject('No primitive rendered to be ready.');
      }
    },

    /**
     * @return {Primitive} The Cesium Primitive. Throws an error if the primitive is not ready. Use
     *     {@link #ready()} to wait until it is.
     */
    getPrimitive: function() {
      var primitive = this._primitive;
      if (!primitive.ready) {
        throw new Error('Primitive not ready - use ready() to wait.');
      }
      return primitive;
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
      this._transformModelMatrix(this._calcTranslateMatrix(centroid, target));
      this._super(translation);
      // Ignore the initial translation which centres the mesh at the given geoLocation.
      if (this._isSetUp) {
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
          // NOTE: We must set the model as dirty before calling _resetModelMatrix() to ensure
          // the model matrix is regenerated.
          this.setDirty('model');
          // NOTE: geoLocation is moved as well to ensure that the matrix transformation necessary
          // for translation is minimal, reducing the issue described above.
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
      this._transformModelMatrix(this._calcTransformOriginMatrix(scaleMatrix));
      this._super(scale);
    },

    rotate: function(rotation, centroid) {
      centroid = centroid || this.getCentroid();
      this._transformModelMatrix(this._calcRotateMatrix(rotation, centroid));
      this._super(rotation);
    },

    /**
     * Applies the given transformation matrix to the existing model matrix.
     * @param {Matrix4} modelMatrix
     * @private
     */
    _transformModelMatrix: function(modelMatrix) {
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
        this._resetModelMatrix();
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
    _calcTranslateMatrix: function(source, target) {
      var sourceCartesian = this._renderManager.cartesianFromGeoPoint(source);
      var targetCartesian = this._renderManager.cartesianFromGeoPoint(target);
      var diffCartesian = Cartesian3.subtract(targetCartesian, sourceCartesian, new Cartesian3());
      return Matrix4.fromTranslation(diffCartesian);
    },

    _postTransform: function() {
      // Avoid setting "model" to dirty when transforming since we use the matrix transformations in
      // Cesium.
      this._invalidateGeometry();
      this.setDirty('modelMatrix');
      this._update();
    },

    _toCesiumMaterial: function(material) {
      // Temporary solution until we have factories.
      if (material instanceof ColorCore) {
        material.toCesiumColor = Color.prototype.toCesiumColor.bind(material);
        return Color.prototype.toCesiumMaterial.apply(material);
      } else {
        throw new Error('Cannot create Cesium Material.');
      }
    },

    _getFillColor: function() {
      var style = this._style;
      var material = style.getFillMaterial();
      if (material instanceof ColorCore) {
        return Color.prototype.toCesiumColor.bind(material)();
      } else {
        // Only color is supported for polyline borders at the moment. Reject all other materials.
        throw new Error('Only Color material is supported for Mesh fill.');
      }
    }

  });

  return Mesh;
});

define([
  'atlas/util/AtlasMath',
  'atlas/util/WKT',
  'atlas/util/ConvexHullFactory',
  'atlas/model/GeoPoint',
  'atlas/model/Vertex',
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
], function(AtlasMath, WKT, ConvexHullFactory, GeoPoint, Vertex, BoundingSphere,
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

    _updateVisibility: function(visible) {
      if (this._primitive) this._primitive.show = visible;
    },

    /**
     * Builds the geometry and appearance data required to render the Polygon in
     * Cesium.
     */
    _build: function() {
      if (!this._primitive || this.isDirty('entity') || this.isDirty('vertices') ||
          this.isDirty('model')) {
        if (this._primitive) {
          this._renderManager.getPrimitives().remove(this._primitive);
        }
        this._primitive = this._createPrimitive();
        this._renderManager.getPrimitives().add(this._primitive);
      } else if (this.isDirty('style')) {
        this._updateAppearance();
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
          modelMatrix = this._updateModelMatrix(),
          color = ColorGeometryInstanceAttribute.fromColor(this._style.getFillColour()),
          instance = new GeometryInstance({
            id: this.getId().replace('mesh', ''),
            geometry: geometry,
            modelMatrix: modelMatrix,
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

    _updateModelMatrix: function() {
      // TODO(aramk) Only update if necessary.
      if (!(this._rotation instanceof Vertex)) {
        this._rotation = new Vertex(0, 0, 0);
      }
      // Construct rotation and translation transformation matrix.
      // TODO(bpstudds): Only rotation about the vertical axis is implemented.
      if (this.isDirty('entity') || this.isDirty('model')) {
        // The matrix to apply transformations on.
        var modelMatrix = Matrix4.IDENTITY.clone();
        // Apply rotation, translation and scale transformations.
        var rotationTranslation = Matrix4.fromRotationTranslation(
            // Input angle must be in radians.
            Matrix3.fromRotationZ(AtlasMath.toRadians(this._rotation.z)),
            new Cartesian3(0, 0, 0));
        var locationCartesian = this._renderManager.cartesianFromGeoPoint(this._geoLocation);
        Matrix4.multiply(Transforms.eastNorthUpToFixedFrame(locationCartesian), rotationTranslation,
            modelMatrix);
        Matrix4.multiplyByScale(modelMatrix, this._scale, modelMatrix);
        this._modelMatrix = modelMatrix;
      }
      return this._modelMatrix;
    },

    /**
     * Updates the appearance data.
     * @private
     */
    _updateAppearance: function() {
      if (this.isDirty('entity') || this.isDirty('style')) {
        if (!this._appearance) {
          this._appearance =
              this._primitive.getGeometryInstanceAttributes(this.getId().replace('mesh', ''));
        }
        this._appearance.color =
            ColorGeometryInstanceAttribute.toValue(Colour.toCesiumColor(this._style.getFillColour()));
      }
      return this._appearance;
    },

    /**
     * @returns {Array.<atlas.model.GeoPoint>} The final vertices of this Mesh after all
     * transformations.
     * @private
     */
    _calcVertices: function() {
      // Remove elevation from positions array.
      var cartesians = [];
      for (var i = 0; i < this._positions.length; i += 3) {
        cartesians.push(new Cartesian3(this._positions[i], this._positions[i + 1]));
      }
      var modelMatrix = this._updateModelMatrix();
      return cartesians.map(function(position) {
        var transformedCartesian = Matrix4.multiplyByPoint(modelMatrix, position, new Cartesian3());
        return this._renderManager.geoPointFromCartesian(transformedCartesian);
      }, this);
    },

//  TODO(aramk) This is disabled for now since Mesh doesn't support reusing primitives and
//  applying a differnet model matrix like Polygon can.
//    _onTransform: function() {
//      // Avoid setting "model" to dirty when transforming since we use the matrix transformations in
//      // Cesium.
//      this.setDirty('modelMatrix');
//      this._update();
//    },

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
    }
  });

  return Mesh;
});


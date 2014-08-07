define([
  'atlas/util/DeveloperError',
  'atlas/model/Style',
  'atlas/model/Vertex',
  'atlas/model/GeoEntity',
  // Cesium includes
  'atlas-cesium/cesium/Source/Core/BoundingSphere',
  'atlas-cesium/cesium/Source/Core/Cartographic',
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
  'atlas-cesium/cesium/Source/Scene/MaterialAppearance',
  'atlas-cesium/cesium/Source/Scene/PerInstanceColorAppearance',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  'atlas-cesium/model/Colour',
  //Base class.
  'atlas/model/Mesh',
  'atlas/lib/utility/Log'
], function(DeveloperError, Style, Vertex, GeoEntity, BoundingSphere, Cartographic,
            Cartesian3, CesiumColor, ColorGeometryInstanceAttribute, ComponentDatatype, Geometry,
            GeometryAttribute, GeometryAttributes, GeometryInstance, GeometryPipeline, Matrix3,
            Matrix4, PrimitiveType, Transforms, MaterialAppearance, PerInstanceColorAppearance,
            Primitive, Colour, MeshCore, Log) {

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
     * Shows the Mesh. The rendering data is recreated if it has been invalidated.
     */
    show: function() {
      // TODO(bpstudds): Update this to new format.
      if (!this.isRenderable()) {
        this._build();
      } else if (this.isVisible()) {
        Log.debug('Tried to show entity ' + this.getId() +
            ', which is already correctly rendered.');
        return true;
      }
      this._selected && this.onSelect();
      Log.debug('Showing entity', this.getId());
      this._primitive && (this._primitive.show = true);
      return this.isRenderable() && this.isVisible();
    },

    /**
     * Hides the Mesh.
     */
    hide: function() {
      this._primitive && (this._primitive.show = false);
    },

    /**
     * @returns {Boolean} Whether the Mesh is visible.
     */
    isVisible: function() {
      return this._primitive && this._primitive.show === true;
    },

    onSelect: function() {
      this._super();
      var attributes;
      if (this._primitive) {
        attributes =
            this._primitive.getGeometryInstanceAttributes(this.getId().replace('mesh', ''));
        attributes.color =
            ColorGeometryInstanceAttribute.toValue(Colour.toCesiumColor(GeoEntity.getSelectedStyle()).fill);
      }
    },

    onDeselect: function() {
      this._super();
      if (this._primitive) {
        var attributes = this._primitive.getGeometryInstanceAttributes(this.getId().replace('mesh',
            ''));
        attributes.color =
            ColorGeometryInstanceAttribute.toValue(Colour.toCesiumColor(this._style._fillColour));
      }
    },

    /**
     * Builds the geometry and appearance data required to render the Polygon in
     * Cesium.
     */
    _build: function() {
      if (!this._primitive || this.isDirty('vertices') || this.isDirty('model')) {
        if (this._primitive) {
          this._renderManager.getPrimitives().remove(this._primitive);
        }
        this._primitive = this._createPrimitive();
        this._renderManager.getPrimitives().add(this._primitive);
      } else if (this.isDirty('style')) {
        this._updateAppearance();
      }
      this.clean();
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
          geometry = this._updateGeometry(),
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
      thePrimitive.show = false;
      return thePrimitive;
    },

    /**
     * Updates the geometry data as required.
     * @returns {GeometryInstance}
     * @private
     */
    _updateGeometry: function() {
      var ellipsoid = this._renderManager.getEllipsoid();

      // Generate new cartesians if the vertices have changed.
      if (this.isDirty('entity') || this.isDirty('vertices') || this.isDirty('model')) {
        var theGeometry = {};
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

        theGeometry.attributes = geometry.attributes;
        theGeometry.indices = geometry.indices;
        theGeometry.primitiveType = geometry.primitiveType;
        theGeometry.boundingSphere = geometry.boundingSphere;
      }
      return theGeometry || this._geometry;
    },

    _updateModelMatrix: function() {
      var ellipsoid = this._renderManager.getEllipsoid();
      if (!(this._rotation instanceof Vertex)) {
        this._rotation = new Vertex(0, 0, 0);
      }
      // Construct rotation and translation transformation matrix.
      // TODO(bpstudds): Only rotation about the vertical axis is implemented.
      if (this.isDirty('entity') || this.isDirty('model')) {
        var rotationTranslation = Matrix4.fromRotationTranslation(
            // Input angle must be in radians.
            Matrix3.fromRotationZ(this._rotation.z * Math.PI / 180),
            new Cartesian3(0.0, 0.0, 0));
        // Apply rotation, translation and scale transformations.
        var modelMatrix = Matrix4.multiplyByScale(
            Matrix4.multiply(
                Transforms.eastNorthUpToFixedFrame(ellipsoid.cartographicToCartesian(
                    Cartographic.fromDegrees(this._geoLocation.x, this._geoLocation.y))),
                rotationTranslation),
            this._scale);
      }
      return modelMatrix || this._modelMatrix;
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
     * Function to permanently remove the Mesh from the scene (vs. hiding it).
     */
    remove: function() {
      this._super();
      this._primitive && this._renderManager.getPrimitives().remove(this._primitive);
    }
  });

  return Mesh;
});


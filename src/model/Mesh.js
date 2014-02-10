define([
  'atlas/util/DeveloperError',
  'atlas/model/Colour',
  'atlas/model/Style',
  'atlas/model/Vertex',
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
  //Base class.
  'atlas/model/Mesh'
], function (
  DeveloperError,
  Colour,
  Style,
  Vertex,
  BoundingSphere,
  Cartographic,
  Cartesian3,
  CesiumColor,
  ColorGeometryInstanceAttribute,
  ComponentDatatype,
  Geometry,
  GeometryAttribute,
  GeometryAttributes,
  GeometryInstance,
  GeometryPipeline,
  Matrix3,
  Matrix4,
  PrimitiveType,
  Transforms,
  MaterialAppearance,
  PerInstanceColorAppearance,
  Primitive,
  MeshCore) {

  /**
   * @classdesc A Mesh represents a 3D renderable object in atlas.
   * @param {String} id - The ID of th/pull-request/20/converting-geoentity-and-its-subtypes-to/diff#chg-src/model/Polygon.jse Mesh.
   * @param {String} meshData - The data required to render the Mesh.
   * @param {Array.<Number>} meshData.geoLocation - The location of the Mesh in an [latitude, longitude, elevation] formatted array. Unique positions need to be defined for every triangle vertex to ensure shading works correctly.
   * @param {Array.<Number>} meshData.positions - A 1D array of position data, every 3 elements forming a vertex, ie a (x, y, z) coordinate tuple in model space.
   * @param {Array.<Number>} meshData.triangles - A 1D array of the triangles forming the mesh. Every 3 elements forming a new triangle with counter-clockwise winding order.
   * @param {Array.<Number>} [meshData.normals] - CURRENTLY NOT USED. A 1D array of normals for each vertex in the triangles array. Every 3 elements form an (x, y, z) vector tuple.
   * @param {Array.<Number>} [meshData.color] - The uniform colour of the Mesh, given as a [red, green, blue, alpha] formatted array.
   * @param {Array.<Number>} [meshData.scale] - The scale of the Mesh.
   * @param {Array.<Number>} [meshData.rotation] - The rotation of the Mesh.
   * @param {Object} args - Required and optional arguments to construct the Mesh object.
   * @param {String} args.id - The ID of the GeoEntity. (Optional if both <code>id</code> and <code>args</code> are provided as arguments)
   * @param {atlas.render.RenderManager} args.renderManager - The RenderManager object responsible for the GeoEntity.
   * @param {atlas.events.EventManager} args.eventManager - The EventManager object responsible for the Event system.
   * @param {atlas.events.EventTarget} [args.parent] - The parent EventTarget object of the GeoEntity.g
   *
   * @see {@link atlas.model.Mesh}
   * @see {@link atlas.model.GeoEntity}
   *
   * @class atlas-cesium.model.Mesh
   * @extends atlas.model.Mesh
   */
  var Mesh = MeshCore.extend( /** @lends atlas-cesium.model.Mesh# */ {

    /**
     * The Cesium Primitive object.
     * @type {Primitive}
     * @private
     */
    _primitive: null,


    /**
     * Shows the Mesh. The rendering data is recreated if it has been invalidated.
     */
    show: function () {
      // TODO(bpstudds): Update this to new format.
      if (!this.isRenderable()) {
        this._build();
      } else if (this.isVisible()) {
        console.debug('Tried to show entity ' + this.getId() + ', which is already correctly rendered.');
        return;
      }
      console.debug('Showing entity', this.getId());
      this._primitive.show = true;
    },

    /**
     * Hides the Mesh.
     */
    hide: function () {
      this._primitive && (this._primitive.show = false);
    },

    /**
     * @returns {Boolean} Whether the Mesh is visible.
     */
    isVisible: function () {
      return this._primitive && this._primitive.show;
    },

    onSelect: function () {
      this.setStyle(MeshCore.SELECTED_STYLE);
      if (this._primitive) {
        var attributes = this._primitive.getGeometryInstanceAttributes(this.getId().replace('mesh', ''));
        attributes.color = ColorGeometryInstanceAttribute.toValue(Mesh._convertAtlasToCesiumColor(this._style._fillColour));
      }
      this.onEnableEditing();
    },

    onDeselect: function () {
      this.setStyle(this._previousStyle);
      if (this._primitive) {
        var attributes = this._primitive.getGeometryInstanceAttributes(this.getId().replace('mesh', ''));
        attributes.color = ColorGeometryInstanceAttribute.toValue(Mesh._convertAtlasToCesiumColor(this._style._fillColour));
      }
      this.onDisableEditing();
    },

    /**
     * Builds the geometry and appearance data required to render the Polygon in
     * Cesium.
     */
    _build: function () {
      if (!this._primitive || this._dirty['vertices'] || this._dirty['model']) {
        if (this._primitive) {
          this._renderManager._widget.scene.getPrimitives().remove(this._primitive);
        }
        this._primitive = this._createPrimitive();
        this._renderManager._widget.scene.getPrimitives().add(this._primitive);
      } else if (this._dirty['style']) {
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
    _createPrimitive: function () {
      if (this.isRenderable()) { return null; }

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
    _updateGeometry: function () {
      var ellipsoid = this._renderManager._widget.centralBody.getEllipsoid();

      // Generate new cartesians if the vertices have changed.
      if (this._dirty['entity'] || this._dirty['vertices'] || this._dirty['model']) {
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
        // Compute normals if they are not passed int.
        if (!this._normals) {
          geometry = GeometryPipeline.computeNormal(geometry);
        } else {
          geometry.attributes.normal = new GeometryAttribute({
            componentDatatype: ComponentDatatype.FLOAT,
            componentsPerAttribute: 3,
            values: this._normals
          });
        }
        theGeometry.attributes = geometry.attributes;
        theGeometry.indices = geometry.indices;
        theGeometry.primitiveType = geometry.primitiveType;
        theGeometry.boundingSphere = geometry.boundingSphere;
      }
      return theGeometry || this._geometry;
    },

    _updateModelMatrix: function () {
      var ellipsoid = this._renderManager._widget.centralBody.getEllipsoid();
      if (!(this._rotation instanceof Vertex)) {
        this._rotation = new Vertex(0,0,0);
      }
      // Construct rotation and translation transformation matrix.
      // TODO(bpstudds): Only rotation about the vertical axis is implemented.
      if (this._dirty['entity'] || this._dirty['model']) {
        var rotationTranslation = Matrix4.fromRotationTranslation(
          // Input angle must be in radians.
          Matrix3.fromRotationZ(this._rotation.z * Math.PI / 180),
          new Cartesian3(0.0, 0.0, 35));
        // Apply rotation, translation and scale transformations.
        var modelMatrix = Matrix4.multiplyByScale(
          Matrix4.multiply(
            Transforms.eastNorthUpToFixedFrame(ellipsoid.cartographicToCartesian(
              Cartographic.fromDegrees(this._geoLocation.y, this._geoLocation.x))),
            rotationTranslation),
          this._scale);
      }
      return modelMatrix || this._modelMatrix;
    },

    /**
     * Updates the appearance data.
     * @private
     */
    _updateAppearance: function () {

      if (this._dirty['entity'] || this._dirty['style']) {
        if (!this._primitive) {
          this._appearance = ColorGeometryInstanceAttribute.fromColour(Mesh._convertAtlasToCesiumColor(this._style.getFillColour()));
        } else {
          if (!this._appearance) {
            this._appearance = this._primitive.getGeometryInstanceAttributes(this.getId().replace('mesh', ''));
          }
          this._appearance.color = ColorGeometryInstanceAttribute.toValue(Mesh._convertAtlasToCesiumColor(this._style.getFillColour()));
        }
      }
      return this._appearance;
    },

    /**
     * Function to permanently remove the Mesh from the scene (vs. hiding it).
     */
    remove: function () {
      this._super();
      this._primitive && this._renderManager._widget.scene.getPrimitives().remove(this._primitive);
    }
  });

  // TODO(bpstudds): Move this to some central location.
  Mesh._convertStyleToCesiumColors = function(style) {
    return {
      fill: Mesh._convertAtlasToCesiumColor(style.getFillColour()),
      border: Mesh._convertAtlasToCesiumColor(style.getBorderColour())
    }
  };

  // TODO(bpstudds): Move this to some central location.
  Mesh._convertAtlasToCesiumColor = function (color) {
    // TODO(bpstudds) Determine how to get Cesium working with alpha enabled.
    return new CesiumColor(color.red, color.green, color.blue, /* override alpha temporarily*/ 1);
  };

  return Mesh;
});


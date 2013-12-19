define([
  'atlas/util/Extends',
  'atlas/model/Colour',
  // Cesium includes
  'atlas-cesium/cesium/Source/Core/BoundingSphere',
  'atlas-cesium/cesium/Source/Core/Cartographic',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
  'atlas-cesium/cesium/Source/Core/ColorGeometryInstanceAttribute',
  'atlas-cesium/cesium/Source/Core/ComponentDatatype',
  'atlas-cesium/cesium/Source/Core/Geometry',
  'atlas-cesium/cesium/Source/Core/GeometryAttribute',
  'atlas-cesium/cesium/Source/Core/GeometryAttributes',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Core/GeometryPipeline',
  'atlas-cesium/cesium/Source/Core/Matrix4',
  'atlas-cesium/cesium/Source/Core/PrimitiveType',
  'atlas-cesium/cesium/Source/Core/Transforms',
  'atlas-cesium/cesium/Source/Scene/PerInstanceColorAppearance',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  //Base class.
  'atlas/model/GeoEntity'
], function (extend,
              Color,
              BoundingSphere,
              Cartographic,
              Cartesian3,
              ColorGeometryInstanceAttribute,
              ComponentDatatype,
              Geometry,
              GeometryAttribute,
              GeometryAttributes,
              GeometryInstance,
              GeometryPipeline,
              Matrix4,
              PrimitiveType,
              Transforms,
              PerInstanceColorAppearance,
              Primitive,
              MeshCore) {

  var Mesh = function (positions, triangles) {
    /**
     * The array of vertex positions for this Mesh, in model space coordinates.
     * This is a 1D array to conform with Cesium requirements. Every three elements of this
     * array describes a new vertex, with each element being the x, y, z component respectively.
     * @type {Array.{Number}}
     */
    this._positions = [];
    if (positions.length) {
      console.debug('the input positions', positions);
      this._positions = new Float64Array(positions.length * 3);
      var j = 0;
      for (var i = 0; i < positions.length; i++) {
        this._positions[j++] = (positions[i].x);
        this._positions[j++] = (positions[i].y);
        this._positions[j++] = (positions[i].z);
      }
      console.debug('the positions', this._positions);
    }

    /**
     * The array of indices describing the 3D mesh. Every three elements of the array are grouped
     * together and describe a triangle forming the mesh. The value of the element is the index
     * of virtual positions array (the array if each element in <code>Mesh._positions</code> was
     * an (x,y,z) tuple) that corresponds to that vertex of the triangle.
     */
    this._indices = [];
    if (triangles.length) {
      console.debug('the input triangles', triangles);
      this._indices = new Uint16Array(triangles.length * 3);
      var j = 0;
      for (var i = 0; i < triangles.length; i++) {
        this._indices[j++] = (triangles[i][0]);
        this._indices[j++] = (triangles[i][1]);
        this._indices[j++] = (triangles[i][2]);
      }
      console.debug('the indices', this._indices);
    }

    /**
     * The location of the mesh object in latitude and longitude.
     * @type {atlas/model/Vertex}
     */
    this._location = {};

    /**
     * Defines a transformation from model coordinates to world coordinates.
     * @type {cesium/Core/Matri4}
     */
    this._modelMatrix = {};

    this._geometry = {};
  };
  extend(MeshCore, Mesh);


  Mesh.prototype.createPrimitive = function () {
    this.createGeometry();
    var ellipsoid = this._renderManager._widget.centralBody.getEllipsoid();

    var modelMatrix = Matrix4.multiplyByUniformScale(
      Matrix4.multiplyByTranslation(
        Transforms.eastNorthUpToFixedFrame(ellipsoid.cartographicToCartesian(
          Cartographic.fromDegrees(-100.0, 40.0))),
        new Cartesian3(0.0, 0.0, 200000.0)),
      500000.0);

    var instance = new GeometryInstance({
      geometry : this._geometry,
      modelMatrix : modelMatrix,
      attributes : {
        color : ColorGeometryInstanceAttribute.fromColor(Color.GREEN)
      }
    });

    var primitive = new Primitive({
      geometryInstances : instance,
      appearance : new PerInstanceColorAppearance({
        flat : false,
        translucent : false
      }),
      debugShowBoundingVolume: false
    });

    console.debug('the primitive', primitive);
    this._renderManager._widget.scene.getPrimitives().add(primitive);
    primitive.show = true;
  };

  Mesh.prototype.createGeometry = function () {

    var attributes = new GeometryAttributes({
      position : new GeometryAttribute({
        componentDatatype : ComponentDatatype.DOUBLE,
        componentsPerAttribute : 3,
        values : this._positions
      })
    });

    var geometry = GeometryPipeline.computeNormal(new Geometry({
      attributes: attributes,
      indices: this._indices,
      primitiveType: PrimitiveType.TRIANGLES,
      boundingSphere: BoundingSphere.fromVertices(this._positions)
    }));

    this._geometry.attributes = geometry.attributes;
    this._geometry.indices = geometry.indices;
    this._geometry.primitiveType = geometry.primitiveType;
    this._geometry.boundingSphere = geometry.boundingSphere;

    return this._geometry;
  }

  return Mesh;
});


define([
  'atlas/lib/Q',
  'atlas/lib/utility/Setter',
  'atlas/model/GeoPoint',
  'atlas/model/Rectangle',
  'atlas/util/WKT',
  'atlas-cesium/cesium/Source/Core/Matrix4',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
  'atlas-cesium/cesium/Source/Scene/Model',
  'atlas-cesium/model/Mesh',
], function(Q, Setter, GeoPoint, Rectangle, WKT, Matrix4, Cartesian3, CesiumModel, Mesh) {

  /**
   * @typedef {atlas-cesium.model.GltfMesh}
   * @ignore
   */
  var GltfMesh;

  /**
   * GltfMesh represents a Model defined by Khronos Group GLTF runtime assest format. @see
   *     {@link https://github.com/KhronosGroup/glTF} for the specification. A Collada to GLTF
   *     converter is available.
   *
   * @see {@link atlas.model.Mesh}
   * @see {@link atlas.model.GeoEntity}
   *
   * @class atlas-cesium.model.GltfMesh
   * @extends atlas-cesium.model.Mesh
   */
  GltfMesh = Mesh.extend( /** @lends atlas-cesium.model.GltfMesh# */ {

    /**
     * The base URL that URLs with the GLTF data are relative to.
     * @type {String}
     */
    _baseUrl: null,

    _setup: function(id, meshData, args) {
      this._super(id, meshData, args);

      this._baseUrl = Setter.def(meshData.baseUrl, '');
      this._centroid = new GeoPoint(this._geoLocation);
    },

    _createPrimitive: function() {
      var args = {
        id: this.getId(),
        baseUrl: this._baseUrl,
        modelMatrix: this._getModelMatrix(),
        scale: this._uniformScale,
        allowPicking: this.isSelectable()
      };

      if (this._gltf) {
        args.gltf = this._gltf;
        return new CesiumModel(args);
      } else if (this._gltfUrl) {
        args.url = this._gltfUrl;
        return CesiumModel.fromGltf(args);
      } else {
        throw new Error('Tried to create GLTF Mesh without specifying GLTF JSON or URL.');
      }
    },

    _updateAppearance: function() {
      // Overridden to be no-op as it is called automatically by Mesh._build. Apart from the call
      // to this function, the logic in Mesh._build is needed here and should not be replicated. DRY
    },

    _calculateVertices: function() {
      throw new Error('Function _calculateVertices not supported by GltfMesh');
    },

    _getFootprintVertices: function() {
      throw new Error('Function _getFootprintVertices not supported by GltfMesh');
    },

    getOpenLayersGeometry: function(args) {
      var wkt = WKT.getInstance();
      var centroid = this.getCentroid();
      if (!centroid) {
        return null;
      }
      var model = this._primitive;
      var radius = model.boundingSphere.radius;

      var utmCentroid = centroid.toUtm();
      var utmCoord = utmCentroid.coord;
      var metaData = Setter.clone(utmCentroid);
      delete metaData.coord;
      
      var rectangle = new Rectangle({
        north: this._createEdgePointFromUtmCoord(utmCoord.x, utmCoord.y + radius, metaData),
        south: this._createEdgePointFromUtmCoord(utmCoord.x, utmCoord.y - radius, metaData),
        east: this._createEdgePointFromUtmCoord(utmCoord.x + radius, utmCoord.y, metaData),
        west: this._createEdgePointFromUtmCoord(utmCoord.x - radius, utmCoord.y, metaData)
      });
      var points = rectangle.getCorners();
      if (args && args.utm) {
        return wkt.openLayersPolygonFromVertices(points.map(function(point) {
          return point.toUtm().coord;
        }));
      } else {
        return wkt.openLayersPolygonFromGeoPoints(points);
      }
    },

    _createEdgePointFromUtmCoord: function(x, y, metaData) {
      return GeoPoint.fromUtm(Setter.merge({coord: {x: x, y: y}}, metaData));
    },

    /**
     * @return {Promise} The centroid of this GLTF mesh.
     */
    getCentroid: function() {
      var model = this._primitive;
      var centroidCartesian = Matrix4.multiplyByPoint(model.modelMatrix,
        model.boundingSphere.center, new Cartesian3());
      return this._renderManager.geoPointFromCartesian(centroidCartesian);
    }

  });

  return GltfMesh;

});

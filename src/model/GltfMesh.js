define([
  'atlas/lib/Q',
  'atlas/lib/utility/Setter',
  'atlas/model/GeoPoint',
  'atlas-cesium/cesium/Source/Scene/Model',
  'atlas-cesium/model/Mesh'
], function(Q, Setter, GeoPoint, CesiumModel, Mesh) {

  /**
   * @typedef {atlas-cesium.model.GltfMesh}
   * @ignore
   */
  var GltfMesh;

  GltfMesh = Mesh.extend( /** @lends atlas-cesium.model.GltfMesh# */ {

    /**
     * The base URL that URLs with the GLTF data are relative to.
     * @type {String}
     */
    _baseUrl: null,

    _init: function(id, meshData, args) {
      this._super(id, meshData, args);

      this._baseUrl = Setter.def(meshData.baseUrl, '');
      this._centroid = new GeoPoint(this._geoLocation);
    },

    _createPrimitive: function() {
      var thePrimitive,
          args = {
            id: this.getId(),
            baseUrl: this._baseUrl,
            modelMatrix: this._getModelMatrix(),
            scale: this._uniformScale
          };

      if (this._gltf) {
        args.gltf = this._gltf;
        return new CesiumModel(args);
      } else if (this._gltfUrl) {
        args.url = this._gltfUrl;
        return CesiumModel.fromGltf(args);
      }

      throw new Error('Tried to create GLTF Mesh without specifying GLTF JSON or URL.');
    },

    _updateAppearance: function() {
      // Overridden to be no-op as it is called automatically by  Mesh._build. Apart from the call
      // to this function, the logic in Mesh._build is needed here and should not be replicated. DRY
    },

    _whenPrimitiveReady: function() {
      var df = Q.defer();
      this._primitive && this._primitive.readyToRender.addEventListener(function(model) {
        df.resolve();
      });
      return df;
    },

    _calculateVertices: function() {
      throw new Error('Function not supported by GltfMesh');
    },

    _getFootprintVertices: function() {
      throw new Error('Function not supported by GltfMesh');
    },

    getOpenLayersGeometry: function() {
      throw new Error('Function not supported by GltfMesh');
    },

  });

  return GltfMesh;

});

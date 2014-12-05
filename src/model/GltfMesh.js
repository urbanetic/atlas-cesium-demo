define([
  'atlas/lib/Q',
  'atlas-cesium/model/Mesh'
], function(Q, Mesh) {

  /**
   * @typedef {atlas-cesium.model.GltfMesh}
   * @ignore
   */
  var GltfMesh;

  GltfMesh = Mesh.extend( /** @lends atlas-cesium.model.GltfMesh# */ {

    _createPrimitive: function() {
      var thePrimitive,
          args = {
            id: this.getId(),
            modelMatrix: this._getModelMatrix(),
            scale: this._uniformScale
          };

      if (this._gltf) {
        args.gltf = this._gltf;
        return new Model(args);
      } else if (this._gltfUrl) {
        args.url = this._gltfUrl;
        return Model.fromUrl(args);
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

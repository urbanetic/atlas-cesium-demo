define([
  'jasmine-async',
  'atlas-cesium/model/GltfMesh'
], function(JasmineAsync, GltfMesh) {

  var mesh,
      meshData,
      args;

  describe('A GltfMesh', function() {

    beforeEach(function() {
      meshData = {
        gltf: {}
      };
      args = {
        renderManager: {},
        eventManager: {}
      };
    });

    afterEach(function() {
      mesh = null;
    });

    it('can be constructed', function() {
      mesh = new GltfMesh('id', meshData, args);
      expect(mesh).not.toBe(undefined);
    });

    it('can be constructed with URL to GLTF', function() {
      meshData.gltfUrl = './assets/duck.gltf';
      mesh = new GltfMesh('id', meshData, args);
      expect(mesh).not.toBe(undefined);
      expect(mesh.getId()).toEqual('id');
    });

  })
});

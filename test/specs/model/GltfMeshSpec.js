define([
  'atlas-cesium/render/RenderManager',
  'atlas-cesium/model/GltfMesh'
], function(RenderManager, GltfMesh) {

  var mesh,
      meshData,
      args;

  describe('A GltfMesh', function() {

    beforeEach(function() {
      meshData = {
        gltf: {}
      };
      args = {
        renderManager: new RenderManager({}),
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

    // TODO(bpstudds): Can this be tested without mocking a heap of Cesium components.
    xit('can construct a primitive', function() {
      meshData.gltfUrl = './assets/duck.gltf';
      mesh = new GltfMesh('id', meshData, args);
      mesh._createPrimitive();
    });

    // TODO(bpstudds): Can this be tested without starting a Cesium instance?
    xit('should eventually be ready', function(done) {
      meshData.gltfUrl = './assets/duck.gltf';
      mesh = new GltfMesh('id', meshData, args);
      mesh._whenPrimitiveReady().promise.then(function() {
        done();
      });
    });

  })
});

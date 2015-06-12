define([
  'atlas/model/GeoPoint',
  'atlas-cesium/render/LocalTerrainData',
  'atlas-cesium/test/util/AtlasCesiumTestFactory'
], function(GeoPoint, LocalTerrainData, AtlasCesiumTestFactory) {

  var ltd;
  var args;
  var gltfUrl = 'assets/tonsley.gltf';
  var geoLocation = {
    latitude: -35.010184,
    longitude: 138.574999,
    elevation: 0
  };
  var rotation = {
    x: 0,
    y: 0,
    z: 1.391552680067
  };
  var renderManager = AtlasCesiumTestFactory.createManager('render');

  describe('A LocalTerrainData', function() {

    beforeEach(function() {
      args = {
        mesh: {
          gltfUrl: gltfUrl,
          geoLocation: geoLocation,
          rotation: rotation
        },
        heightMap: {
          geoLocation: geoLocation,
          resolution: 5,
          width: 500,
          height: 600,
          points: [[1,  2,  3,  4,  5],
                  [11, 12, 13, 14, 15],
                  [21, 22, 23, 24, 25],
                  [31, 32, 33, 34, 35],
                  [41, 42, 43, 44, 45]]
        },
        renderManager: renderManager
      };
    });

    afterEach(function() {
      args = null;
    });

    // -------------------------------------------
    // Construction
    // -------------------------------------------
    it('cannot be constructed without a height map', function() {
      args.heightMap = null;
      expect(function() {
        ltd = new LocalTerrainData(args);
      }).toThrow();
    });

    it('cannot be constructed without a mesh', function() {
      args.mesh = null;
      expect(function() {
        ltd = new LocalTerrainData(args);
      }).toThrow();
    });

    it('can be constructed when given a glTF URL', function() {
      ltd = new LocalTerrainData(args);
      expect(ltd).toBeDefined();
      expect(ltd.getMesh()).toBeDefined();
      expect(ltd.getMesh().isGltf()).toBe(true);
    });

    // TODO(aramk) Only Gltf meshes are supported according to LocalTerrainData.js
    // it('can be constructed when given a C3ML mesh object', function() {
    //   args.mesh.gltfUrl = null;
    //   args.mesh.positions = [];
    //   args.mesh.indices = [];
    //   ltd = new LocalTerrainData(args);
    //   expect(ltd).toBeDefined();
    //   expect(ltd.getMesh()).toBeDefined();
    //   expect(ltd.getMesh().isGltf()).toBe(false);
    // });

    // -------------------------------------------
    // Terrain Sampling
    // -------------------------------------------
    describe('(Terrain sampling)', function() {
      beforeEach(function() {
        // Generate some terrain data somehow.
        ltd = new LocalTerrainData(args);
      });

      it('can sample the terrain when given points within the terrain', function() {
        var points = [geoLocation];
        var heights = ltd.sampleTerrain(points);
        expect(heights).toEqual([23]);
      });

      it('shall return "null" when sample points outside the defined terrain', function() {
        var points = [new GeoPoint({latitude: 0, longitude: 0})];
        var heights = ltd.sampleTerrain(points);
        expect(heights.length).toBe(0);
      });

    });

  });

});

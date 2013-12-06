define([
  'doh/runner',
  'dam/TestCase',
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Core/PolygonGeometry',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  'atlas-cesium/cesium/Source/Core/Cartographic',
  'atlas-cesium/cesium/Source/Scene/EllipsoidSurfaceAppearance',
  'atlas-cesium/cesium/Source/Scene/MaterialAppearance',
  /* Code under test */
  '../Polygon',
], function (doh, TestCase, GeometryInstance, PolygonGeometry, Primitive, Cartographic, EllipsoidSurfaceAppearance, MaterialAppearance, Polygon) {

  /* Test globals go here */
  var polygon; 
  var id;
  var args;
  var mockedRM = {
    _widget: {
      centralBody: {
        getEllipsoid: function () {
          return mockedEllipsoid;
        }
      },
      scene: {
        getPrimitives: function () {
          return [];
        }
      }
    },
    getMinimumTerrainHeight: function (h) {
      return 0;
    }
  };
  var mockedEllipsoid = {
    cartographicArrayToCartesianArray: function (array) {
      return array;
    }
  };



  /* Begin test case definitions */
  new TestCase({

    name: 'atlas-cesium/model/Polygon',

    setUp: function () {
      // summary:
      id = 12345;
      args = {
        vertices: "POLYGON ((1 2, 3 4, 5 6, 7 8))",
        renderManager: mockedRM,
        eventManager: {}
      };
      polygon = new Polygon(id, args.vertices, args);
    },

    tearDown: function () {
      polygon = {};
    },

    testCreatePrimitive: function () {
      polygon._createPrimitive();
      doh.assertTrue(polygon._primitive instanceof Primitive, 'primitive wrong'); 
      doh.assertTrue(polygon.isRenderable(), 'polygon is not renderable');
    },

    testBuild2d: function () {
      polygon._height = 0;
      polygon._build(mockedEllipsoid, /*elevation from rendermanager*/ 0);
      doh.assertTrue(polygon._appearance instanceof EllipsoidSurfaceAppearance, 'appearance wrong');
      doh.assertTrue(polygon._geometry instanceof GeometryInstance, 'geometry wrong');
      doh.assertTrue(!polygon.isRenderable(), 'shouldn\' be renderable');
    },

    testBuildNoHeight: function () {
      delete polygon._height;
      polygon._build(mockedEllipsoid, /*elevation from rendermanager*/ 0);
      doh.assertTrue(polygon._appearance instanceof EllipsoidSurfaceAppearance, 'wrong appearance');
      doh.assertTrue(polygon._geometry instanceof GeometryInstance, 'wrong geometry');
      doh.assertTrue(!polygon.isRenderable(), 'shouldn\'t be renderable');
    },

    testBuildExtruded: function () {
      polygon._height = 500;
      polygon._build(mockedEllipsoid, /*elevation from rendermanager*/ 0);
      doh.assertTrue(polygon._appearance instanceof MaterialAppearance, 'wrong appearance');
      doh.assertTrue(polygon._geometry instanceof GeometryInstance, 'wrong geometry');
      doh.assertTrue(!polygon.isRenderable(), 'shouldn\'t be renderable');
    }
  }).register(doh);
});


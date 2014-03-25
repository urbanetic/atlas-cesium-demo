define([
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Scene/MaterialAppearance',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  // Code under test
  'atlas-cesium/model/Ellipse'
], function (GeometryInstance, MaterialAppearance, Primitive, Ellipse) {
  describe ('An Ellipse', function () {
    var ellipse,
        ellipseData,
        args,
        mockedRenderManager;

    beforeEach (function () {
      mockedRenderManager = {
        cartesianFromCartographic: function (c) {
          return {latitude: c.x, longitude: c.y, height: c.z};
        },
        getMinimumTerrainHeight: function () { return 0; },
        _widget: {
          scene: {
            getPrimitives: function () {
              return {
                add: function () { ; },
                remove: function () { ; }
              }
            }
          }
        }
      };
      ellipseData = {
        centroid: {x: 0, y: 0, z: 0},
        semiMajor: 10,
        semiMinor: 10
      };
      args = {
        renderManager: mockedRenderManager
      };
    });

    afterEach (function () {
      ellipse = null;
    });

    describe ('can be constructed', function () {
      it ('when all expected arguments are given', function () {
        ellipse = new Ellipse('id', ellipseData, args);
        expect(ellipse).not.toBeNull();
        expect(ellipse.getId()).toEqual('id');
      });
    }); // End 'will be constructed'

    describe ('cannot be constructed', function () {
      it ('without specifying the Render manager', function () {
        var fails = function () {
          delete args.renderManager;
          new Ellipse('id', ellipseData, args);
        };
        expect(fails).toThrow();
      });
    }); // End 'cannot be constructed'

    describe ('can generate data required to render', function () {
      beforeEach (function () {
        ellipse = new Ellipse('id', ellipseData, args);
      });

      it ('geometry data', function () {
        var geometry = ellipse._updateGeometry();
        expect(geometry instanceof GeometryInstance).toBe(true);
      });

      it ('appearance data', function () {
        var appearance = ellipse._updateAppearance();
        expect(appearance instanceof MaterialAppearance).toBe(true);
      });

      it ('primitive object', function () {
        var primitive = ellipse._createPrimitive();
        expect(primitive instanceof Primitive).toBe(true);
      });

      it ('but does not regenerate data if not required', function () {
        ellipse.show();
        var geometry1 = ellipse._geometry,
            appearance1 = ellipse._appearance,
            primitive1 = ellipse._primitive;
        ellipse.hide();
        ellipse.show();
        var geometry2 = ellipse._geometry,
            appearance2 = ellipse._appearance,
            primitive2 = ellipse._primitive;
        expect(geometry1).toEqual(geometry2);
        expect(appearance1).toEqual(appearance2);
        expect(primitive1).toEqual(primitive2);
      })
    }); // End 'can generate data required to render'
  }); // End 'An Ellipse'
});

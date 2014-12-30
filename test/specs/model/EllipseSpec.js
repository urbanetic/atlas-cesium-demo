define([
  'atlas-cesium/cesium/Source/Core/GeometryInstance',
  'atlas-cesium/cesium/Source/Scene/MaterialAppearance',
  'atlas-cesium/cesium/Source/Scene/Primitive',
  // Code under test
  'atlas-cesium/model/Ellipse'
], function(GeometryInstance, MaterialAppearance, Primitive, Ellipse) {
  describe ('An Ellipse', function() {
    var ellipse,
        ellipseData,
        args,
        mockedRenderManager;

    beforeEach (function() {
      mockedRenderManager = {
        cartesianFromCartographic: function(c) {
          return {latitude: c.x, longitude: c.y, height: c.z};
        },
        getMinimumTerrainHeight: function() { return 0; },
        _widget: {
          scene: {
            getPrimitives: function() {
              return {
                add: function() { ; },
                remove: function() { ; }
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

    afterEach (function() {
      ellipse = null;
    });

    describe ('can be constructed', function() {
      it ('when all expected arguments are given', function() {
        ellipse = new Ellipse('id', ellipseData, args);
        expect(ellipse).not.toBeNull();
        expect(ellipse.getId()).toEqual('id');
      });
    }); // End 'will be constructed'

    describe ('cannot be constructed', function() {
      it ('without specifying the Render manager', function() {
        var fails = function() {
          delete args.renderManager;
          new Ellipse('id', ellipseData, args);
        };
        expect(fails).toThrow();
      });
    }); // End 'cannot be constructed'

    describe ('when constructed', function() {

      beforeEach (function() {
        ellipse = new Ellipse('id', ellipseData, args);
      });

      describe ('can generate data required to render', function() {

        it ('geometry data', function() {
          var geometry = ellipse._updateGeometry();
          expect(geometry).not.toBeNull();
          expect(geometry instanceof GeometryInstance).toBe(true);
        });

        it ('appearance data', function() {
          var appearance = ellipse._updateAppearance();
          expect(appearance).not.toBeNull();
          expect(appearance instanceof MaterialAppearance).toBe(true);
        });

        it ('primitive object', function() {
          var primitive = ellipse._createPrimitive();
          expect(primitive).not.toBeNull();
          expect(primitive instanceof Primitive).toBe(true);
        });

        it ('but does not regenerate data if not required', function() {
          ellipse.show();
          var geometry1 = ellipse._geometry,
              appearance1 = ellipse._appearance,
              primitive1 = ellipse._primitive;
          ellipse.hide();
          ellipse.show();
          var geometry2 = ellipse._geometry,
              appearance2 = ellipse._appearance,
              primitive2 = ellipse._primitive;
          expect(geometry2).toEqual(geometry1);
          expect(appearance2).toEqual(appearance1);
          expect(primitive2).toEqual(primitive1);
        });
      }); // End 'can generate data required to render'

      describe ('can partially update', function() {
        it ('when the centroid is moved', function() {
          // Initial conditions
          ellipse.show();
          var appearance1 = ellipse._appearance,
              primitive1 = ellipse._primitive;
          // Change geometry of Ellipse and check only that changed.
          ellipse.translate({x: 10, y: 20});
          ellipse.show();
          var appearance2 = ellipse._appearance,
              primitive2 = ellipse._primitive;
          // Do a dodgy to check primitive hasn't been recreated.
          primitive2.geometryInstances = primitive1.geometryInstances;
          expect(appearance2).toEqual(appearance1);
          expect(primitive2).toEqual(primitive1);
        });

        it ('when the semi major/minor axis is changed', function() {
          // Initial conditions
          ellipse.show();
          var appearance1 = ellipse._appearance,
              primitive1 = ellipse._primitive;
          // Change geometry of Ellipse and check only that changed.
          ellipse.scale({x: 1, y: 1});
          ellipse.show();
          var appearance2 = ellipse._appearance,
              primitive2 = ellipse._primitive;
          // Do a dodgy to check primitive hasn't been recreated.
          primitive2.geometryInstances = primitive1.geometryInstances;
          expect(appearance2).toEqual(appearance1);
          expect(primitive2).toEqual(primitive1);
        });

        it ('when style is changed, geometry is unchanged', function() {
          // Initial conditions
          ellipse.show();
          var geometry1 = ellipse._geometry,
              appearance1 = ellipse._appearance,
              primitive1 = ellipse._primitive;
          // Change geometry of Ellipse and check only that changed.
          ellipse.modifyStyle({fillMaterial: {red: 1, green: 1, blue: 1}});
          ellipse.show();
          var geometry2 = ellipse._geometry,
              appearance2 = ellipse._appearance,
              primitive2 = ellipse._primitive;
          expect(geometry2).toEqual(geometry1);
          // Do a dodgy to check primitive hasn't been recreated.
          primitive2.appearance = primitive1.appearance;
          expect(primitive2).toEqual(primitive1);
        });
      }); // End 'can partially update'
    }); // End 'when constructed'
  }); // End 'An Ellipse'
});

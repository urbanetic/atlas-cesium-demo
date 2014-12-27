define([
  'atlas/assets/testMesh',
  'atlas/assets/testWKT',
  'atlas/lib/utility/Class',
  'atlas/material/Color',
  'atlas/model/GeoEntity',
  'atlas/model/Feature',
  'atlas/model/GeoPoint',
  'atlas/material/Style',
  'atlas-cesium/model/Handle',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
  'atlas-cesium/cesium/Source/Core/Ellipsoid',
  'jquery'
], function(testMesh, testWKT, Class, Color, GeoEntity, Feature, GeoPoint, Style, Handle,
  Cartesian3, Ellipsoid, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var someFeature = features[0];
      var targetPosition = someFeature.getCentroid().translate(new GeoPoint(0.001, 0.001));

      cesiumAtlas.publish('camera/zoomTo', {
        position: targetPosition
      });

      $.getJSON('assets/VIC_SH_2St_3Bed_roof.c3ml.json', function(c3ml) {
        console.log('c3ml', c3ml);
        atlas.publish('entity/show/bulk', {features: [c3ml]});
        var feature = entityManager.getById(c3ml.id);
        // feature.setForm(Feature.DisplayMode.MESH, meshFeature);
        var mesh = feature.getForm(Feature.DisplayMode.MESH);

        var positions = mesh._getFootprintVertices();

        atlas.publish('entity/show', {
          id: 'mesh-footprint',
          polygon: {
            vertices: positions
          }
        });
        var polygonFeature = entityManager.getById('mesh-footprint');
        var polygon = polygonFeature.getForm();
        // Remove the original feature and use the underlying polygon.
        polygonFeature.remove(false);
        feature.setForm(Feature.DisplayMode.FOOTPRINT, polygon);

        mesh.setCentroid(targetPosition);
        polygon.setCentroid(targetPosition);
        feature.show();

        var displayModes = [Feature.DisplayMode.FOOTPRINT, Feature.DisplayMode.MESH];
        var displayModeIndex = 0;
        setInterval(function() {
          feature.setDisplayMode(displayModes[displayModeIndex % displayModes.length]);
          displayModeIndex++;
        }, 4000);

        atlas.subscribe('entity/dblclick', function() {
          console.log('entity/dblclick', arguments);
        });

        // Set up popup for the feature to show for both the mesh and the polygon.
        atlas.publish('popup/onSelection', {
          entity: feature,
          content: function(args) {
            var entity = args.entity;
            return '<div>A brief description of the entity.</div>' + 
            '<div>Area: ' + entity.getArea() + '</div>';
          },
          title: function(args) {
            var entity = args.entity;
            return 'Entity: ' + entity.getId();
          },
          onCreate: function(popup) {
          }
        });

      });

    }

  });
});

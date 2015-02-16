define([
  'atlas/assets/testMesh',
  'atlas/assets/testWKT',
  'atlas/lib/utility/Class',
  'atlas/lib/utility/Setter',
  'atlas/material/Color',
  'atlas/model/GeoEntity',
  'atlas/model/Feature',
  'atlas/model/GeoPoint',
  'atlas/material/Style',
  'atlas-cesium/model/Handle',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
  'atlas-cesium/cesium/Source/Core/Ellipsoid',
  'jquery'
], function(testMesh, testWKT, Class, Setter, Color, GeoEntity, Feature, GeoPoint, Style, Handle,
  Cartesian3, Ellipsoid, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas, location) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;

      var targetPosition = Setter.defCstr(location, GeoPoint, {
        latitude: -37.924113,
        longitude: 144.886450,
        elevation: -1000
      });

      $.getJSON('assets/VIC_SH_2St_3Bed_roof.c3ml.json', function(c3ml) {
        c3ml.show = true;
        console.log('c3ml', c3ml);
        atlas.publish('entity/create/bulk', {features: [c3ml]});
        var mesh = entityManager.getById(c3ml.id);

        var positions = mesh._getFootprintVertices();

        targetPosition = new GeoPoint(c3ml.geoLocation);
        atlas.publish('camera/zoomTo', {
          position: targetPosition
        });

        atlas.publish('entity/create', {
          id: 'mesh-footprint',
          polygon: {
            vertices: positions
          },
          show: true
        });
        var polygonFeature = entityManager.getById('mesh-footprint');
        var polygon = polygonFeature.getForm();
        // Remove the original feature and use the underlying polygon.
        polygonFeature.remove(false);

        mesh.setCentroid(targetPosition);
        polygon.setCentroid(targetPosition);

        var displayModes = [Feature.DisplayMode.FOOTPRINT, Feature.DisplayMode.MESH];
        var displayModeIndex = 0;

        atlas.subscribe('entity/dblclick', function() {
          console.log('entity/dblclick', arguments);
        });

        // Set up popup for the feature to show for both the mesh and the polygon.
        atlas.publish('popup/onSelection', {
          entity: mesh,
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

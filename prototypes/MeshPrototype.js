define([
  'atlas/lib/utility/Class',
  'atlas/material/Color',
  'atlas/model/GeoEntity',
  'atlas/model/GeoPoint',
  'atlas/material/Style',
  'atlas-cesium/model/Handle',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
  'atlas-cesium/cesium/Source/Core/Ellipsoid',
  'jquery'
], function(Class, Color, GeoEntity, GeoPoint, Style, Handle, Cartesian3, Ellipsoid, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      $.getJSON('assets/VIC_SH_2St_3Bed_roof.c3ml.json', function(c3ml) {
        c3ml.show = false;
        console.log('c3ml', c3ml);
        c3ml.geoLocation = [145.253159238, -37.81175024725, 0];
        atlas.publish('entity/show/bulk', {features: [c3ml]});

        var id = c3ml.id;
        var meshFeature = entityManager.getById(id);

        meshFeature.translate(new GeoPoint({latitude: 0.001, longitude: 0.001}));

        var mesh = meshFeature.getForm();
        var positions = mesh._getFootprintVertices();
        console.log('positions', positions);
        var centroid = mesh.getCentroid();
        console.log('centroid', centroid);

        atlas.publish('entity/show', {
          id: 'mesh-footprint',
          polygon: {
            vertices: positions,
            style: new Style({borderMaterial: new Color('yellow')}),
            width: '1px'
          }
        });

        var centroidHandle = new Handle(meshFeature._bindDependencies({target: centroid, owner: meshFeature}));
        centroidHandle.show();

        atlas.publish('camera/zoomTo', {position: centroid});

        setTimeout(function() {
//          mesh.setElevation(10);
          console.log('showing');
          mesh.translate(new GeoPoint(0, 0, 10));
          atlas.publish('entity/show', {
            id: id
          });
          //mesh.show();
        }, 4000);

      });
    }

  });
});

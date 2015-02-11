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
        c3ml.color = 'rgba(255, 0, 0, 1)';
        console.log('c3ml', c3ml);
        c3ml.geoLocation = [145.253159238, -37.81175024725, 0];
        atlas.publish('entity/create/bulk', {features: [c3ml]});

        var id = c3ml.id;
        var mesh = entityManager.getById(id);

        var translation = new GeoPoint({latitude: 0.001, longitude: 0.001});
        mesh.translate(translation);

        var positions = mesh._getFootprintVertices();
        console.log('positions', positions);
        var centroid = mesh.getCentroid();
        console.log('centroid', centroid);

        atlas.publish('entity/create', {
          id: 'mesh-footprint',
          polygon: {
            vertices: positions,
            style: new Style({borderMaterial: new Color('yellow')}),
            width: '1px'
          }
        });

        var centroidHandle = new Handle(mesh._bindDependencies({target: centroid, owner: mesh}));
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

        var id2 = id + '2';
        c3ml.id = id2;
        c3ml.show = true;
        c3ml.color = 'blue';
        atlas.publish('entity/create/bulk', {features: [c3ml]});
        var mesh = entityManager.getById(id2);
        mesh.translate(translation);
        mesh.translate(new GeoPoint({latitude: 0.00001, longitude: 0.00001}));

      });
    }

  });
});

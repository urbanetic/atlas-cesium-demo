define([
  'atlas/lib/utility/Class',
  'atlas/model/GeoEntity',
  'atlas/model/GeoPoint',
  'atlas-cesium/model/Handle',
  'jquery'
], function(Class, GeoEntity, GeoPoint, Handle, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      $.getJSON('assets/VIC_SH_2St_3Bed_roof.c3ml.json', function(c3ml) {
        console.log('c3ml', c3ml);
        c3ml.geoLocation = [145.253159238, -37.81175024725, 0];
        atlas.publish('entity/show/bulk', {features: [c3ml]});
        var point = new GeoPoint(c3ml.geoLocation);
        atlas.publish('camera/zoomTo', {position: point});
        // TODO(aramk) Create handle on mesh.
        var id = c3ml.id;
        var mesh = entityManager.getById(id);
        new Handle(mesh._bindDependencies({target: point, owner: mesh}));
        setTimeout(function () {
          console.log('translate');
          mesh.translate(new GeoPoint({latitude: 0.001, longitude: 0.001}));
        }, 3000);
      });
    }

  });
});

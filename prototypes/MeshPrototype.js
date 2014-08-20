define([
  'atlas/lib/utility/Class',
  'atlas/model/GeoEntity',
  'jquery'
], function(Class, GeoEntity, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      $.getJSON('assets/VIC_SH_2St_3Bed_roof.c3ml.json', function(c3ml) {
        console.log('c3ml', c3ml);
        atlas.publish('entity/show/bulk', {features: [c3ml]});
        var loc = c3ml.geoLocation;
        atlas.publish('camera/zoomTo', {position: {longitude: loc[0], latitude: loc[1], elevation: 100}});
      });
    }

  });
});

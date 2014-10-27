define([
  'atlas/lib/utility/Class',
  'atlas/model/GeoPoint',
  'atlas/model/Vertex'
], function(Class, GeoPoint, Vertex) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      //      atlas.publish('sleepMode', false);
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var feature = features[0];

      $.getJSON('assets/VIC_SH_2St_3Bed_roof.c3ml.json', function(c3ml) {
        c3ml.show = false;
        console.log('c3ml', c3ml);
        c3ml.geoLocation = feature.getCentroid().toArray();
        atlas.publish('entity/show/bulk', {
          features: [c3ml]
        });
        var id = c3ml.id;
        var meshFeature = entityManager.getById(id);
        var mesh = meshFeature.getForm();

        feature.setForm('mesh', mesh);
        feature.translate(new GeoPoint(0.003, 0.003));
        feature.setRotation(new Vertex(0, 0, 90));
        feature.setScale(new Vertex(1.5, 1.5, 4));

        var modeOffset = 0;
        var modes = ['footprint', 'extrusion', 'mesh'];
        setInterval(function() {
          var mode = modes[modeOffset % modes.length];
          feature.setDisplayMode(mode);
          modeOffset++;
        }, 3000);
      });
    }

  });
});
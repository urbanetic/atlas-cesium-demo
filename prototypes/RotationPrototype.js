define([
  'atlas/lib/utility/Class',
  'atlas/model/GeoPoint',
  'atlas/model/Vertex',
  'atlas-cesium/model/Polygon'
], function(Class, GeoPoint, Vertex, Polygon) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      //      atlas.publish('sleepMode', false);
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var feature = features[0];

      // setInterval(function() {
      //   features.forEach(function(feature) {
      //     feature.rotate(new Vertex(0, 0, 15));
      //   });
      // }, 200);

      $.getJSON('assets/VIC_SH_2St_3Bed_roof.c3ml.json', function(c3ml) {
        c3ml.show = false;
        c3ml.geoLocation = feature.getCentroid().toArray();
        atlas.publish('entity/show/bulk', {
          features: [c3ml]
        });
        var id = c3ml.id;
        var meshFeature = entityManager.getById(id);
        var mesh = meshFeature.getForm();

        feature.setForm('mesh', mesh);
        feature.setDisplayMode('mesh');

        var vertices = mesh._getFootprintVertices();
        var polygon = new Polygon('poly123', {
          vertices: vertices,
          show: true
        }, feature._bindDependencies({show: true}));
        // atlas.publish('entity/show', {
        //   id: 'poly123',

        // });

        // TODO(aramk) Rotation is not set on the mesh if changed on the feature?
        // mesh.translate(new GeoPoint(0.003, 0.003));
        // mesh.rotate(new Vertex(0, 0, 15));
        // mesh.setRotation(new Vertex(0, 0, 15));

        // polygon.translate(new GeoPoint(0.003, 0.003));
        // polygon.rotate(new Vertex(0, 0, 15));
        // polygon.setRotation(new Vertex(0, 0, 15));

        // Scaling and rotation over time.
        polygon.scale(new Vertex(0.5, 0.5, 0.5));
        feature.scale(new Vertex(0.5, 0.5, 0.5));
        setInterval(function() {
          [polygon, feature].forEach(function(entity) {
            entity.rotate(new Vertex(0, 0, 15));
            entity.translate(new GeoPoint(0.00005, 0.00005));
          });
        }, 1000);

        // feature.setScale(new Vertex(1.5, 1.5, 4));

        // var modeOffset = 0;
        // var modes = ['footprint', 'extrusion', 'mesh'];
        // setInterval(function() {
        //   var mode = modes[modeOffset % modes.length];
        //   console.log('mode: ' + mode);
        //   feature.setDisplayMode(mode);
        //   modeOffset++;
        // }, 3000);

        // setInterval(function() {
        //   console.log('transforming');
        //   feature.rotate(new Vertex(0, 0, 15));
        // }, 3000);        

        // setTimeout(function() {
        //   console.log('transforming');
        //   feature.translate(new GeoPoint(0.003, 0.003));
        // }, 3000);

        atlas.publish('camera/zoomTo', {
          // position: feature.getCentroid()
          position: polygon.getCentroid()
        });

      });
    }

  });
});
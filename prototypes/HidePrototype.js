define([
  'atlas/lib/utility/Class',
  'atlas/model/GeoPoint'
], function(Class, GeoPoint) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var feature = features[0];
      var entity = feature.getForm();

      // Test whether transforming a polygon will take effect even if it's hidden initially.

      var newEntityId = 'foo';
      var entityJson = entity.toJson();
      entityJson.height = 100;
      entityJson.id = newEntityId;
      entityJson.show = false;
      console.log('entityJson', entityJson);
      atlas.publish('entity/create/bulk', {features: [entityJson]});
      var newEntity = entityManager.getById(newEntityId);
      var oldCentroid = newEntity.getCentroid();
      newEntity.translate(new GeoPoint(0.1, 0.1));
      var newCentroid = newEntity.getCentroid();
      console.log('oldCentroid', oldCentroid);
      console.log('newCentroid', newCentroid);

      var cameraPosition = newCentroid.translate(new GeoPoint({elevation: 500}));
      atlas.publish('camera/zoomTo', {position: cameraPosition});
      console.log('hidden');
      setTimeout(function() {
        newEntity.show();
        console.log('visible');
      }, 5000);

      // Test whether transforming a mesh will take effect even if it's hidden initially.

      setTimeout(function() {
        $.getJSON('assets/VIC_SH_2St_3Bed_roof.c3ml.json', function(c3ml) {
          c3ml.show = false;
          c3ml.color = 'rgba(255, 0, 0, 1)';
          c3ml.geoLocation = [145.253159238, -37.81175024725, 0];
          atlas.publish('entity/create/bulk', {features: [c3ml]});

          var id = c3ml.id;
          var mesh = entityManager.getById(id);
          var newMeshCentroid = newCentroid.translate(new GeoPoint(0.001, 0.001));
          mesh.setCentroid(newMeshCentroid);

          console.log('hidden');
          setTimeout(function() {
            mesh.show();
            console.log('visible');
          }, 5000);
        });
      }, 6000);

    }

  });
});

define([
  'atlas/lib/utility/Class',
  'atlas/model/GeoEntity',
  'atlas/model/GeoPoint'
], function(Class, GeoEntity, GeoPoint) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var feature = features[0];
      var entity = feature.getForm();
      
      var newEntityId = 'foo';
      var entityJson = entity.toJson();
      entityJson.height = 100;
      entityJson.id = newEntityId;
      console.log('entityJson', entityJson);
      atlas.publish('entity/create/bulk', {features: [entityJson]});
      var newEntity = entityManager.getById(newEntityId);
      newEntity.translate(new GeoPoint(0.001, 0.001));
    }

  });
});

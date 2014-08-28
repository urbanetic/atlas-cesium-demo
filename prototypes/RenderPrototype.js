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
      var features = entityManager.getFeatures();
      var feature = features[0];
      var entity = feature.getForm();
      setTimeout(function() {
        console.log('starting test');

        entity._build();

//        setTimeout(function() {
          entity.setDirty('model');
//        entity.setDirty('style');
          entity._build();
//        }, 1000);

//      entity.setStyle(GeoEntity.getSelectedStyle());

//      feature.setSelected(true);
//        entity.setSelected(true);
//      entity.setDirty('model');

//      entity.setDirty('style');
//      entity.setDirty('model');
//      feature.setDirty('model');
//      feature.setDirty('style');

//      entity.enableExtrusion();

//      entity._build();
//      entity.show();
//      feature.show();
//      feature.show();
        return;
        entity.show();

//        var id = entity.getId();
//        var entity2 = entityManager.getById(id);
//        console.log('entity2', entity2, id);

//        atlas.publish('entity/show', {id: id});

//        return;
        setTimeout(function() {
          entity.setSelected(true);
//          entity.setSelected(true);
          setTimeout(function() {
            // TODO(aramk) FAILS
            entity.show();
            return;
            setTimeout(function() {
              entity.setSelected(true);
              setTimeout(function() {
                entity.show();
              }, 100);
            }, 100);
          }, 100);
        }, 100);

//        setTimeout(function() {
//          console.debug('show', entity);
//          entity.show();
//        }, 4000);
      }, 2000);
    }

  });
});

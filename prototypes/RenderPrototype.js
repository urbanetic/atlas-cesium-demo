define([
  'atlas/lib/utility/Class',
  'jquery'
], function(Class, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      var entities = entityManager.getEntities();
      var entity = entities[0];
      setTimeout(function() {
        entity.show();
        entity.show();
        setTimeout(function() {
          entity.onSelect();
//          entity.onSelect();
          setTimeout(function() {
            // TODO(aramk) FAILS
            entity.show();
//              setTimeout(function() {
//                entity.onSelect();
//                setTimeout(function() {
//                  entity.show();
//                }, 100);
//              }, 100);
          }, 100);
        }, 100);

//        setTimeout(function() {
//          console.debug('show', entity);
//          entity.show();
//        }, 4000);
      }, 100);
    }

  });
});

define([
  'atlas/lib/utility/Class',
  'jquery'
], function(Class, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;

      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var feature = features[0];
      atlas.publish('edit/enable', {ids: [feature.getId()]});
    }

  });
});

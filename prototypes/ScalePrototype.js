define([
  'atlas/lib/utility/Class',
  'atlas/model/Vertex'
], function(Class, Vertex) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var feature = features[0];

      setInterval(function() {
        feature.scale(new Vertex(2, 2, 2));
      }, 1000);
    }

  });
});

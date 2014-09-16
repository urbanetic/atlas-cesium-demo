define([
  'atlas/lib/utility/Class',
  'atlas/model/Vertex'
], function(Class, Vertex) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
//      atlas.publish('sleepMode', false);
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var feature = features[0];
      setInterval(function() {
        feature.rotate(new Vertex(0, 0, 90));
      }, 1000);
    }

  });
});

define([
  'atlas/lib/utility/Class',
  'atlas/model/Collection',
  'atlas/model/Colour',
  'atlas/model/Vertex'
], function(Class, Collection, Colour, Vertex) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var feature = features[0];

      var featureIds = features.map(function(feature) {
        return feature.getId();
      });
      // TODO(aramk) Use dependendency injection or allow adding collections from entity manager.
      // This is a hack!
      var args = feature._bindDependencies({show: true});
      var collection = new Collection('c1', {entities: featureIds}, args);

      // Rotating a collection should rotate around the collection's centroid rather than that of
      // each individual component.
      setInterval(function () {
        collection.rotate(new Vertex(0, 0, 15));
      }, 1000);

    }

  });
});

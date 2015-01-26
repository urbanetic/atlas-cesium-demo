define([
  'atlas/lib/utility/Class',
  'atlas/model/Collection',
  'atlas/material/Color',
  'atlas/model/Vertex'
], function(Class, Collection, Color, Vertex) {
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
      setInterval(function() {
        collection.rotate(new Vertex(0, 0, 15));
      }, 1000);

      collection.setHeight(300);
      collection.setElevation(100);
      console.log('height', collection.getHeight());
      console.log('elevation', collection.getElevation());

      setTimeout(function() {
        collection.setSelected(true);
        console.log('collection selected', collection.isSelected());
      }, 3000);

      // Create a collection through the Atlas API.
      atlas.publish('entity/create/bulk', {
        features: [
          {
            id: 'c2',
            type: 'collection',
            children: ['c1']
          }
        ]
      });

      var c2 = entityManager.getById('c2');
      console.log(c2);
      console.log('c2 json', c2.toJson());

    }

  });
});

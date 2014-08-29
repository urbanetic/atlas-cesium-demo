define([
  'atlas/lib/utility/Class',
  'atlas/model/Collection',
  'atlas/model/Colour'
], function(Class, Collection, Colour) {
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

      var a = feature.isRenderable();
      var b = feature.getForm();
      console.log(a, b);

    }

  });
});

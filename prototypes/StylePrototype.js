define([
  'atlas/lib/utility/Class',
  'atlas/model/Colour',
  'atlas/model/Style',
  'atlas/model/GeoEntity',
  'jquery'
], function(Class, Colour, Style, GeoEntity, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      var feature = features[0];

      var colour = new Colour('red');
      var style = new Style();
      style.setFillColour(colour);
      feature.setStyle(style);
      feature.setDisplayMode('footprint');
    }

  });
});

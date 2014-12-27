define([
  'atlas/lib/utility/Class',
  'atlas/material/CheckPattern',
  'atlas/material/Color',
  'atlas/material/Style'
], function(Class, CheckPattern, Color, Style) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      
      var features = atlas._managers.entity.getFeatures();
      var someFeature = features[0];
      console.log('someFeature', someFeature);

      var checkPattern = new CheckPattern({lightColor: Color.YELLOW, darkColor: Color.RED});
      var currentStyle = someFeature.getStyle();
      var style = new Style({fillMaterial: checkPattern,
          borderMaterial: currentStyle.getBorderMaterial()});
      someFeature.setStyle(style);
      
    }

  });
});
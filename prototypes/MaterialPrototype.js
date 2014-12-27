define([
  'atlas/lib/utility/Class',
  'atlas/material/CheckPattern',
  'atlas/material/Color',
  'atlas/material/Style',
  'atlas/model/GeoPoint'
], function(Class, CheckPattern, Color, Style, GeoPoint) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      
      var features = atlas._managers.entity.getFeatures();
      var featureA = features[0];
      var featureB = features[1];

      // Create material programmatically.

      var checkPattern = new CheckPattern({lightColor: Color.YELLOW, darkColor: Color.RED});
      var currentStyle = featureA.getStyle();
      var style = new Style({fillMaterial: checkPattern,
          borderMaterial: currentStyle.getBorderMaterial()});
      featureA.setStyle(style);

      var translation = new GeoPoint(0.001, 0.001);
      var positions = featureA.getVertices().map(function(point) {
        return point.translate(translation);
      });

      // Create material with c3ml.

      var featureBId = 'material-polygon';
      atlas.publish('entity/show', {
        id: featureBId,
        polygon: {
          vertices: positions,
          height: 50,
          fillMaterial: {
            type: 'CheckPattern',
            lightColor: 'green',
            darkColor: 'red'
          },
          borderMaterial: {
            type: 'Color',
            blue: 1
          }
        }
      });

      var featureB = atlas._managers.entity.getById(featureBId);
        
    }

  });
});

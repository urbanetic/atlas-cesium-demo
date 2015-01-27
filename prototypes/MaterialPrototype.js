define([
  'atlas/lib/utility/Class',
  'atlas/lib/utility/Setter',
  'atlas/material/CheckPattern',
  'atlas/material/Color',
  'atlas/material/Style',
  'atlas/model/GeoPoint'
], function(Class, Setter, CheckPattern, Color, Style, GeoPoint) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      
      var features = atlas._managers.entity.getFeatures();
      var featureA = features[0];
      var featureB = features[1];
      var featureC = features[2];

      // Create material programmatically.

      var checkPattern = new CheckPattern({color1: Color.YELLOW, color2: Color.RED});
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
      atlas.publish('entity/create', {
        id: featureBId,
        polygon: {
          vertices: positions,
          height: 50,
          style: {
            fillMaterial: {
              type: 'CheckPattern',
              color1: 'green',
              color2: 'red'
            },
            borderMaterial: {
              type: 'Color',
              blue: 1
            },
            borderWidth: 5
          }
        },
        show: true
      });

      var featureB = atlas._managers.entity.getById(featureBId);
      console.log('featureB', featureB.toJson());
        
      // Set the opacity for one feature to 50%.

      var styleC = new Style(featureC.getStyle());
      var fillC = new Color('green')
      fillC.alpha = 0.5;
      styleC.setFillMaterial(fillC);
      featureC.setStyle(styleC);

      var featureCJson = featureC.toJson();
      console.log('featureC', featureCJson);

      // Create a new feature from the json of another.

      var featureDId = 'featureD';
      var featureDJson = Setter.clone(featureCJson);
      featureDJson.id = featureDId;
      atlas.publish('entity/create/bulk', {
        features: [featureDJson]
      });
      var featureD = atlas._managers.entity.getById(featureDId);
      console.log('featureD', featureD.toJson());
      featureD.translate(translation);
    }

  });
});

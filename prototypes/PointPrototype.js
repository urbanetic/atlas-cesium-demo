define([
  'atlas/lib/utility/Class',
  'atlas/material/Color',
  'atlas/material/Style',
  'atlas/model/GeoPoint',
  'atlas/model/Point',
  'atlas/util/WKT'
], function(Class, Color, Style, GeoPoint, Point, WKT) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      
      var features = atlas._managers.entity.getFeatures();
      var featureA = features[0];
      var featureB = features[1];
      var featureC = features[2];

      var pointAPosition = featureA.getCentroid().translate({longitude: 0.001, latitude: 0.001});
      var wkt = WKT.getInstance();
      var pointAWkt = wkt.wktFromGeoPoint(pointAPosition);

      var pointAId = 'point-A';
      atlas.publish('entity/create', {
        id: pointAId,
        point: {
          position: pointAPosition,
          // position: pointAWkt,
          // longitude: pointAPosition.longitude,
          // latitude: pointAPosition.latitude,
          elevation: 10,
          style: {
            fillMaterial: {
              type: 'Color',
              red: 1
            }
          }
        },
        show: true
      });

      var pointA = atlas._managers.entity.getById(pointAId);
      console.log('pointA', pointA.toJson());

      var colors = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'violet'];
      var colorIndex = 0;
      setInterval(function() {
        var colorName = colors[colorIndex % colors.length];
        var style = new Style({fillMaterial: new Color(colorName)});
        console.log('color', colorName);
        pointA.setStyle(style);
        colorIndex++;
      }, 1000);

    }

  });
});

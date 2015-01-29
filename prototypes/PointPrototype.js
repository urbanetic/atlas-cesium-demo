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

      // Create point feature.

      var pointAPosition = featureA.getCentroid()
          .translate(new GeoPoint({longitude: 0.001, latitude: 0.001}));
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
        pointA.setStyle(style);
        colorIndex++;
      }, 1000);

      // Create point c3ml.

      var pointBPosition = pointAPosition
          .translate(new GeoPoint({longitude: 0.001, latitude: 0.001}));
      var pointBId = 'point-B';
      atlas.publish('entity/create/bulk', {
        features: [
          {
            "id": pointBId,
            "type": "point",
            "latitude": pointBPosition.latitude,
            "longitude": pointBPosition.longitude,
            "elevation": 0,
            "color": [
              255,
              18,
              18,
              255
            ],
            "parentId": "4f3cac0a-4c3d-45e8-938d-a024349bd853",
            "children": [],
            "show": true
          }
        ]
      });

      var pointB = atlas._managers.entity.getById(pointBId);
      console.log('pointB', pointB.toJson());
      
    }

  });
});

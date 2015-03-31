define([
  'atlas/lib/utility/Class',
  'atlas/material/Color',
  'atlas/model/GeoEntity',
  'atlas/model/GeoPoint',
  'atlas/material/Style',
  'atlas-cesium/model/Point',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
  'atlas-cesium/cesium/Source/Core/Ellipsoid',
  'jquery'
], function(Class, Color, GeoEntity, GeoPoint, Style, Point, Cartesian3, Ellipsoid, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas, location) {
      this.atlas = atlas;
      var entityManager = atlas.getManager('entity');

      // this.location = location || {
      //   latitude: -37.924113,
      //   longitude: 144.886450,
      //   elevation: -1000
      // };

      // TODO(aramk) GLTF cannot be constructed with atlas since GltfMesh is in atlas-cesium.
      $.getJSON('assets/AH_1St_1Bed_Basic_4plex_KMZ_GLTF_C3ML.json', function(c3mls) {
        atlas.publish('entity/create/bulk', {
          features: c3mls,
          callback: function(ids) {
            var rootIds = [];
            ids.forEach(function(id) {
              if (!entityManager.getById(id).getParent()) {
                rootIds.push(id);
              }
            });
            atlas.publish('entity/create/bulk', {
              features: [{
                id: 'gltf-collection',
                type: 'collection',
                children: rootIds
              }],
              callback: function(ids) {
                var collection = entityManager.getById(ids[0]);
                collection.ready().then(function() {
                  var centroid = collection.getCentroid();
                  atlas.publish('entity/create/bulk', {
                    features: [{id: 'gtlf-centroid', position: centroid, type: 'point'}]
                  });
                  // atlas.publish('camera/zoomTo', {
                  //   position: centroid
                  // });
                  var boundingBox = collection.getBoundingBox();
                  if (boundingBox) {
                    boundingBox.scale(1.5);
                    atlas.publish('camera/zoomTo', {
                      rectangle: boundingBox
                    });
                  }
                }, function(err) {
                  throw err;
                }).catch(function(err) {
                  throw err;
                }).done();
              }
            });
          }
        });
      });

    }

  });
});

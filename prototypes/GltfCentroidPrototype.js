define([
  'atlas/lib/utility/Class',
  'atlas/material/Color',
  'atlas/model/GeoEntity',
  'atlas/model/GeoPoint',
  'atlas/material/Style',
  'atlas-cesium/model/Point',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
  'atlas-cesium/cesium/Source/Core/Ellipsoid',
  'jquery',
  'underscore'
], function(Class, Color, GeoEntity, GeoPoint, Style, Point, Cartesian3, Ellipsoid, $, _) {
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
                // var newCentroid = new GeoPoint({latitude: -37.924113, longitude: 144.886450});
                var newCentroid = new GeoPoint({longitude: 145.23765085412853, latitude: -37.826770509441076});
                collection.ready().then(function() {
                  var centroid = collection.getCentroid();
                  // atlas.publish('entity/create/bulk', {
                  //   features: [{id: 'gtlf-centroid', position: centroid, type: 'point'}]
                  // });
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
                  // var mesh = findGltfMesh(collection);
                  // moveEntity(mesh);
                  // TODO(aramk) Issue in getting centroid of a collection containing a GLTF mesh.
                  // GLTF centroid 
                  moveEntity(collection, newCentroid);
                  atlas.publish('camera/zoomTo', {
                    position: newCentroid
                  });
                  setTimeout(function() {
                    atlas.publish('entity/create/bulk', {
                      features: [{id: 'gtlf-centroid-target', position: newCentroid, type: 'point'}]
                    });
                  }, 3000);
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

      function findGltfMesh(collection) {
        return _.find(collection.getRecursiveChildren(), function(entity) {
          return entity.isGltf && entity.isGltf();
        });
      }

      function moveEntity(entity, newCentroid) {
        // Move the GLTF mesh to a predefined location.
        // var newCentroid = new GeoPoint({latitude: -37.924113, longitude: 144.886450});
        newCentroid = newCentroid || entity.getCentroid()
            // .translate(new GeoPoint({latitude: 0.0001, longitude: 0.0001}));
            .translate(new GeoPoint({latitude: 0.001, longitude: 0.001}));
        console.log('old entity centroid', entity.getCentroid());
        entity.setCentroid(newCentroid);
        console.log('new centroid', entity.getCentroid(), newCentroid);
        setTimeout(function() {
          console.log('new entity centroid', entity.getCentroid());
        }, 5000);
        entityManager.remove('gtlf-centroid');
        newCentroid.elevation = 20;
        // TODO(aramk) Rendering points at startup can crash Cesium.
        // setTimeout(function() {
        //   atlas.publish('entity/create/bulk', {
        //     features: [{id: 'gtlf-centroid', position: newCentroid, type: 'point'}]
        //   });
        // }, 3000);
      }

    }

  });
});

define([
  'atlas/lib/utility/Class',
  'atlas/material/Color',
  'atlas/model/GeoEntity',
  'atlas/model/GeoPoint',
  'atlas/model/Style',
  'atlas-cesium/model/Handle',
  'atlas-cesium/cesium/Source/Core/Cartesian3',
  'atlas-cesium/cesium/Source/Core/Ellipsoid',
  'jquery'
], function(Class, Color, GeoEntity, GeoPoint, Style, Handle, Cartesian3, Ellipsoid, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;

      var location = new GeoPoint({
        latitude: -37.924113,
        longitude: 144.886450,
        elevation: -1000
      });

      atlas.publish('entity/show', {
        id: 'duck',
        mesh: {
          gltfUrl: './assets/duck-no-light.gltf',
          baseUrl: './assets',
          uniformScale: 2000,
          geoLocation: location
        }
      });

      location.elevation = 10000;
      atlas.publish('camera/zoomTo', {
        position: location
      });

    }

  });
});

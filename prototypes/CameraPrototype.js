define([
  'utility/Class',
  'atlas/model/Vertex',
  'atlas/util/AtlasMath',
  'atlas-cesium/cesium/Source/Core/Cartesian3'
], function(Class, Vertex, AtlasMath, Cartesian3) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;

      var cameraManager = atlas._managers.camera,
          renderManager = atlas._managers.render,
          camera = cameraManager._camera,
          cesiumCamera = renderManager.getCesiumCamera();

      window.printCamera = function() {
        var position = camera.getPosition();
        var orientation = camera.getOrientation();
        console.error(position, orientation);
      };

      // Converting between units.

//      var cartesian = camera.position;
//      var cartographic = renderManager.getEllipsoid().cartesianToCartographic(cartesian);
//      var degrees = new Vertex(AtlasMath.toDegrees(cartographic.latitude),
//          AtlasMath.toDegrees(cartographic.longitude), cartographic.height);
//      console.error('pos', cartesian, cartographic, degrees);

//      setInterval(function() {
//
//
//      }, 3000);

      // Point camera towards a location.

      cesiumCamera.lookUp();

      // Move between bookmarks.

//      var posIndex = 0;
//      var args = [
//        {position: {lat: -37.8136, lng: 144.9631, elevation: 10000}, duration: 3000, orientation: {}},
//        {position: {lat: -40.8136, lng: 144.9631, elevation: 8000}, duration: 2000, orientation: {rotation: -180}}
//      ];
//      setInterval(function() {
//        posIndex = posIndex % args.length;
//        var arg = args[posIndex];
//        origCamera._animateCamera(arg);
//        posIndex++;
//      }, 5000);

    }

  });
});
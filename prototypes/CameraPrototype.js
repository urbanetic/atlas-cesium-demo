define([
  'utility/Class',
  'atlas/model/Vertex',
  'atlas/model/GeoPoint',
  'atlas/util/AtlasMath',
  'atlas/camera/Camera',
  'atlas-cesium/cesium/Source/Core/Cartesian3'
], function(Class, Vertex, GeoPoint, AtlasMath, Camera, Cartesian3) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;

      var cameraManager = atlas._managers.camera,
          renderManager = atlas._managers.render,
          camera = cameraManager._camera,
          cesiumCamera = renderManager.getCesiumCamera(),
          ellipsoid = renderManager.getEllipsoid();

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

//      var current = cesiumCamera.position.clone();
//      var targetCarto = ellipsoid.cartesianToCartographic(current);
//      targetCarto.latitude += AtlasMath.toRadians(1);
//      var target = ellipsoid.cartographicToCartesian(targetCarto);
//      cesiumCamera.lookAt(cesiumCamera.position, target, cesiumCamera.up);

//      var current = cesiumCamera.position.clone();
//      var targetGeoPoint = renderManager.geoPointFromCartesian(current);
//      targetGeoPoint.latitude += 1;
//      camera.pointAt(targetGeoPoint);

//      setInterval(function () {
//        var orientation = camera.getOrientation();
//        console.error('orientation', orientation);
//      }, 3000);

//      camera.pointAt(targetGeoPoint);

      // TODO(aramk) Change tilt of the camera manually and read the direction. Create a clone of
      // the camera and perform this change, read the direction and use it for the animation in
      // Camera.js.

      // Move between bookmarks.

      var posIndex = 0;
      var defaultPosition = Camera.DEFAULT_POSITION();
      var otherPosition = Camera.DEFAULT_POSITION();
      otherPosition.latitude += 1;
      var args = [
        {position: defaultPosition, duration: 3000, orientation: {}},
        {position: otherPosition, duration: 2000, orientation: {tilt: 0}}
      ];
      setInterval(function() {
        posIndex = posIndex % args.length;
        var arg = args[posIndex];
        camera.zoomTo(arg);
        posIndex++;
      }, 5000);

    }

  });
});

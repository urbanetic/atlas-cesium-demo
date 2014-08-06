define([
  'atlas/lib/utility/Class',
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

//      var direction1 = cesiumCamera.direction.clone();
//      var tilt1 = cesiumCamera.tilt;

      // Change tilt of the camera manually and read the direction.

//      var angle = AtlasMath.toRadians(50);
//      // Look up
////      cesiumCamera.tilt = cesiumCamera.tilt - angle;
//      // Look down
//      cesiumCamera.look(cesiumCamera.right, angle);

//      var tilt2 = cesiumCamera.tilt;
//      var direction2 = cesiumCamera.direction.clone();

      // Move between bookmarks.

      var posIndex = 0;
      var defaultPosition = Camera.DEFAULT_POSITION();
      var pos2 = Camera.DEFAULT_POSITION();
      pos2.latitude += 1;
//      // TODO(aramk) Save direction instead?
      var args = [
        {position: defaultPosition, duration: 3000, orientation: {tilt: 90}, path: 'linear'},
        {position: pos2, duration: 2000, orientation: {tilt: 45, bearing: 45}, path: 'sinusoidal'}
      ];
      setInterval(function() {
        posIndex = posIndex % args.length;
        var arg = args[posIndex];
        arg._temp = true;
        camera.zoomTo(arg);
        posIndex++;
      }, 5000);

      // Move the camera in a straight path.

//      setInterval(function() {
//        camera.zoomTo({position: pos2, duration: 5000, orientation: {tilt: 45, bearing: 45}});
//      }, 8000);

    }

  });
});

define([
  'utility/Class',
  'atlas/model/Vertex',
  'atlas/util/AtlasMath'
], function(Class, Vertex, AtlasMath) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;

      var cameraManager = atlas._managers.camera,
          renderManager = atlas._managers.render;
      var origCamera = cameraManager._camera;

//            var pos = origCamera.getPosition();
//            console.error('pos', pos);
//          origCamera.setPosition();

//      setInterval(function() {
//        var camera = renderManager.getCesiumCamera();
//        var cartesian = camera.position;
//        var cartographic = renderManager._widget.centralBody.getEllipsoid().cartesianToCartographic(cartesian);
//        var degrees = new Vertex(AtlasMath.toDegrees(cartographic.latitude),
//            AtlasMath.toDegrees(cartographic.longitude), cartographic.height);
//        console.error('pos', cartesian, cartographic, degrees);
//      }, 3000);

      var posIndex = 0;
      var positions = [
        {position: {lat: -37.8136, lng: 144.9631, elevation: 10000}, duration: 3000},
        {position: {lat: -40.8136, lng: 144.9631, elevation: 8000}, duration: 2000}
      ];
      setInterval(function() {
        posIndex = posIndex % positions.length;
        var pos = positions[posIndex];
        origCamera._animateCamera(pos);
        posIndex++;
      }, 5000);

    }

  });
});
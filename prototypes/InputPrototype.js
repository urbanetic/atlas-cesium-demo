define([
  'atlas/lib/utility/Class',
  'jquery'
], function(Class, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var renderManager = atlas._managers.render;
      window.toRadians = function(a) {
        return a * 180 / Math.PI;
      };
      atlas.subscribe('input/leftup', function(args) {
        console.log('screen', args.position);
        var point = renderManager.geoPointFromScreenCoords(args.position);
        console.log('point', point);
      });
      atlas.subscribe('input/left/dblclick', function(args) {
        console.log('');
      });
    }

  });
});

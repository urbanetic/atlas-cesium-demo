define([
  'atlas/lib/utility/Class',
  'jquery',
  'underscore'
], function(Class, $, _) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var renderManager = atlas._managers.render;
      var entityManager = atlas._managers.entity;
      
      atlas.subscribe('input/leftup', function(args) {
        console.log('screen', args.position);
        var point = renderManager.geoPointFromScreenCoord(args.position);
        console.log('point', point);
      });

      // atlas.subscribe('input/left/dblclick', function() {
      //   console.log('input/left/dblclick', arguments);
      // });

      // var entityMouseover = _.debounce(function(event) {
      //   var entities = entityManager.getAt(event.position);
      //   console.log('entity', entities);
      // }, 50);

      // atlas.subscribe('input/mousemove', function(event) {
      //   // console.log('input/mousemove', event);
      //   entityMouseover(event);
      // });

      entityManager.setHighlightOnHover(true);

      atlas.subscribe('entity/mousemove', function() {
        console.log('entity/mousemove', arguments);
      });

      atlas.subscribe('entity/mouseenter', function() {
        console.log('entity/mouseenter', arguments);
      });

      atlas.subscribe('entity/mouseleave', function() {
        console.log('entity/mouseleave', arguments);
      });

    }

  });
});

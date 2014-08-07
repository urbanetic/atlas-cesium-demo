define([
  'atlas/lib/utility/Class',
  'jquery'
], function(Class, $) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;

      $(function() {
        $('#cesium').css({
          'padding-left': '100px',
          'padding-top': '100px'
        });
      });

//      var count = 0;
      var drawMode = function() {
        console.error('entity/draw', arguments);
        atlas.publish('entity/draw', {
          update: function() {
            console.error('update', arguments);
//            count++;
//            if (count === 5) {
//              atlas.publish('entity/draw/stop');
//              count = 0;
//            }
          },
          create: function(args) {
            console.error('create', arguments);
            var feature = args.feature;
            var id = feature.getId();
            setTimeout(function() {
              console.log('edit/enable');
              atlas.publish('edit/enable', {ids: [id]});
            }, 1000);
//            setTimeout(drawMode, 3000);
          },
          cancel: function(args) {
            console.error('cancel', arguments);
            setTimeout(drawMode, 3000);
          }
        });
      };

      setTimeout(drawMode, 1000);

    }

  });
});

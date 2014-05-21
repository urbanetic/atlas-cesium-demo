define([
  'atlas/util/Class'
], function(Class) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;

      var count = 0;
      var drawMode = function() {
        console.error('entity/draw', arguments);
        atlas.publish('entity/draw', {
          update: function() {
            console.error('update', arguments);
            count++;
            if (count === 5) {
              atlas.publish('entity/draw/stop');
              count = 0;
            }
          },
          create: function() {
            console.error('create', arguments);
            setTimeout(drawMode, 3000);
          },
          cancel: function (args) {
            console.error('cancel', arguments);
          }
        });
      };

      setTimeout(drawMode, 1000);

    }

  });
});

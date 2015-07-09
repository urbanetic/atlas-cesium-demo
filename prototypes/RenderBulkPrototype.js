define([
  'atlas/lib/utility/Class',
  'atlas/lib/utility/Log',
  'atlas/lib/utility/Setter',
  'atlas/lib/utility/Types',
  'atlas/material/Color',
  'atlas/material/Style',
  'atlas/model/GeoPoint',
  'atlas/util/WKT'
], function(Class, Log, Setter, Types, Color, Style, GeoPoint, WKT) {
  return Class.extend({

    atlas: null,

    _init: function(atlas, constructArgs) {
      this.atlas = atlas;
      var entityManager = atlas.getManager('entity');

      constructArgs = Setter.merge({
        referencePoint: {
          longitude: 144.9631,
          latitude: -37.8136
        }
      }, constructArgs);

      atlas.publish('camera/zoomTo', {
        position: constructArgs.referencePoint
      });
      window.startRendering = function() {
        var filename = 'fabric-melbourne-2k.c3ml.json';
        $.getJSON('prototypes/resources/assets/' + filename, function(entities) {
          this._renderC3ml(entities);
        }.bind(this));
      }.bind(this);
    },

    _renderC3ml: function(features) {
      features = features.slice(0, 500);
      
      Log.time('bulk-render');
      atlas.publish('entity/create/bulk', {
        features: features,
        // waitForReady: false,
        callbackPromise: true,
        callback: function(promise) {
          promise.then(function() {
            console.debug(arguments);
            Log.timeEnd('bulk-render');
            // moveEntities();
          }, function() {
            console.error(arguments);
          }).progress(function(args) {
            console.debug('progress', args.percent);
          });
        }
      });
    }

  });
});

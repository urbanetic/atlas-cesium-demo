define([
  'atlas/util/Geocoder',
  'atlas/lib/utility/Class'
], function(Geocoder, Class) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var geocoder = new Geocoder();
      geocoder.geocode({address: 'Melbourne, Australia'}).then(function(result) {
        console.log(result);
      });
      geocoder.geocode({address: 'rhfuiehferferhuf'}).then(function(result) {
        console.log(result);
      }, function (err) {
        console.error(err);
      });
      setTimeout(function () {
        atlas.publish('camera/zoomTo', {address: 'Sydney, Australia'});
      }, 2000);
    }

  });
});

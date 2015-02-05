define([
  'atlas/lib/utility/Class',
  'atlas/material/Color',
  'atlas/material/Style',
  'atlas/model/GeoPoint',
  'atlas/model/Point',
  'atlas/util/WKT',
  'jquery',
  'dropzone'
], function(Class, Color, Style, GeoPoint, Point, WKT, $, Dropzone) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      console.log('Starting ACS');
      var $dropzone = $('<div class="dropzone"></div>');
      $('body').append($dropzone);
      var dropzone = new Dropzone($dropzone[0], {
        url: 'http://acs.urbanetic.net/convert',
        dictDefaultMessage: 'Drop a file here or click to upload.',
        addRemoveLinks: false
      });
      dropzone.on('sending', function() {
        console.log('sending', arguments);
      });
      dropzone.on('error', function() {
        console.log('error', arguments);
      });
      dropzone.on('success', function(file, response, progress) {
        console.log('success', arguments);
        atlas.publish('entity/create/bulk', {features: response.c3mls});
        atlas.publish('camera/zoomTo', {position: response.c3mls[0].coordinates[0]});
      });
    }

  });
});

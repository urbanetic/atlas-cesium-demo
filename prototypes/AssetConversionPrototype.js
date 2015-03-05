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
      var $label = $('<label>Merge</label>');
      var $mergeBox = $('<input id="mergeBox" type="checkbox"/>');
      var $clearBtn = $('<button id="clearBtn">Clear</button>');
      $clearBtn.click(function() {atlas.publish('entity/remove/all');});
      $('body').append($dropzone);
      $dropzone.append($label, $mergeBox, $clearBtn);
      var dropzone = new Dropzone($dropzone[0], {
        url: 'http://acs.urbanetic.net/convert',
        //url: 'http://localhost:8090/convert',
        dictDefaultMessage: 'Drop a file here or click to upload.',
        addRemoveLinks: false
      });
      dropzone.on('sending', function(file, xhr, formData) {
        formData.append("merge", $mergeBox.is(':checked'));
        console.log('sending (merge = ' + $mergeBox.is(':checked') + ')', arguments);
      });
      dropzone.on('error', function() {
        console.log('error', arguments);
      });
      var uploadId = 0;
      dropzone.on('success', function(file, response, progress) {
        // TODO(aramk) Append upload Id to all new entities or existing set of entities.
        uploadId++;
        console.log('success', arguments);
        atlas.publish('entity/create/bulk', {features: response.c3mls, callback: function(ids) {
          atlas.publish('entity/create/bulk', {
            features: [{
              id: 'upload-' + uploadId,
              type: 'collection',
              children: ids
            }],
            callback: function(ids) {
              var collection = atlas.getManager('entity').getById(ids[0]);
              var boundingBox = collection.getBoundingBox();
              if (boundingBox) {
                boundingBox.scale(1.5);
                atlas.publish('camera/zoomTo', {
                  // position: collection.getCentroid(),
                  //position: 
                  rectangle: boundingBox
                });
              }
            }
          });
        }});
      });
    }

  });
});

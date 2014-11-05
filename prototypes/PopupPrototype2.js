define([
  'atlas/dom/DomUtil',
  'atlas/lib/utility/Class',
  'atlas/dom/PopupManager',
  'atlas/dom/Popup'
], function(DomUtil, Class, PopupManager, Popup) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var atlasDomNode = atlas._managers.dom.getDom();

      $(function() {
        $('#cesium').css({
          'margin-left': '100px',
          'margin-top': '100px'
        });
      });

      var currentOverlay,
        width = 300,
        height = 100,
        yBuffer = 20,
        renderManager = atlas._managers.render;
      atlas.subscribe('entity/select', function(args) {

        
        
      });

    }

  });
});
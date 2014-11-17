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

      var entityManager = atlas._managers.entity;

      var features = entityManager.getFeatures();
      features.forEach(function(feature) {
        atlas.publish('popup/onSelection', {
          entity: feature,
          content: function(args) {
            var entity = args.entity;
            return '<div>A brief description of the entity.</div>' + 
            '<div>Area: ' + entity.getArea() + '</div>';
          },
          title: function(args) {
            var entity = args.entity;
            return 'Entity: ' + entity.getId();
          },
          onCreate: function(popup) {

          }
        });
      });

    }

  });
});
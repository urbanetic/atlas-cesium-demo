define([
  'atlas/dom/DomUtil',
  'atlas/lib/utility/Class',
  'atlas/dom/PopupManager',
  'atlas/dom/Popup',
  'atlas/events/Event'
], function(DomUtil, Class, PopupManager, Popup, Event) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var atlasDomNode = atlas._managers.dom.getDomNode();

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

      // Removing the entity should remove the popup.
      // var someFeature = features[0];
      // setTimeout(function() {
      //   var event = new Event(someFeature, 'entity/select', {ids: [someFeature.getId()]});
      //   someFeature.dispatchEvent(event);
      //   setTimeout(function() {
      //     someFeature.remove();
      //   }, 2000);
      // }, 2000);

      // Only one popup should appear at once.
      setTimeout(function() {
        features.forEach(function(feature) {
          feature.setSelected(true);
        });
      }, 2000);

    }

  });
});
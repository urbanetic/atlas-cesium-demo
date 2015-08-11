define([
  'atlas/lib/utility/Class',
  'atlas/material/Color',
  'atlas/material/Style'
], function(Class, Color, Style) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;

      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      features.forEach(function(feature, i) {
        var style = new Style({
          fillMaterial: Color.RED,
          borderMaterial: feature.getStyle().getBorderMaterial()
        });
        feature.setStyle(style);
      });

      entityManager.setHighlightOnHover(true);
      setInterval(this.runProjection.bind(this), 10000);
    },

    runProjection: function() {
      var atlas = this.atlas;
      var entityManager = atlas._managers.entity;
      var features = entityManager.getFeatures();
      // Generate dummy values for projection.
      var values = {};
      features.forEach(function(feature, i) {
        // NOTE: Should not get different results whether using features or their forms.
        var id = feature.getId();
        // var id = feature.getForm().getId();
        values[id] = i;
        // feature.setHeight(0);
      });

      // features[0].setSelected(true);

      // var opacity = 0.6;
      // var red = Color.RED.clone();
      // red.alpha = opacity;
      // var green = Color.GREEN.clone();
      // green.alpha = opacity;

      var args = {
        type: 'color',
        ids: Object.keys(values),
        config: {
          title: 'Color Projection',
          values: values,
          opacity: 0.6,
          codomain: {
            startProj: '#00ff00',
            endProj: '#ff0000'
          }
        }
      };
      atlas.publish('projection/add', args);
      atlas.publish('projection/render', {id: args.projection.getId()});

      setTimeout(function() {
        atlas.publish('projection/remove', {id: args.projection.getId()});
      }, 5000);
    }

  });
});

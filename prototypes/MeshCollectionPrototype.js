define([
  'atlas/lib/ConvexHullGrahamScan',
  'atlas/lib/utility/Class',
  'atlas/lib/utility/Objects',
  'atlas/model/GeoEntity',
  'atlas/model/Collection',
  'atlas/model/Feature',
  'atlas/model/GeoPoint',
  'atlas/model/Style',
  'atlas/model/Colour',
  'atlas-cesium/model/Handle',
  'jquery'
], function(ConvexHullGrahamScan, Class, Objects, GeoEntity, Collection, Feature, GeoPoint, Style,
            Colour, Handle, $) {

  console.log('ConvexHullGrahamScan', ConvexHullGrahamScan);

  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;

      var features = entityManager.getFeatures();
      features.forEach(function(feature) {
        feature.setDisplayMode('footprint');
      });
      var feature = features[0];
      var featurePoint = feature.getCentroid();

      $.getJSON('assets/VIC_SH_2St_3Bed.c3ml.json', function(c3mls) {
        atlas.publish('entity/show/bulk', {
          features: c3mls,
          callback: function(ids) {
            var c3mlPoint = new GeoPoint([145.2521592379, -37.81075024723, 0.0]);
            var diff = featurePoint.subtract(c3mlPoint);
            var collection = new Collection('c1', {entities: ids},
                feature._bindDependencies({show: true}));
            feature.setForm(Feature.DisplayMode.MESH, collection);
            feature.setDisplayMode(Feature.DisplayMode.MESH);

            collection.translate(diff);

            var centroid = collection.getCentroid();
            var centroidHandle = new Handle(feature._bindDependencies({target: centroid, owner: collection}));
            centroidHandle.show();

            collection.setElevation(15);
            var entityCount = 0;
            collection.getEntities().forEach(function(entity) {
              var centroid = entity.getCentroid();
              if (!centroid) {
                return;
              }
              entityCount++;
              var vertices = entity.getForm()._getFootprintVertices();

              atlas.publish('entity/show', {
                id: 'mesh-footprint' + entityCount,
                polygon: {
                  vertices: vertices,
                  style: new Style({borderColour: new Colour('yellow')}),
                  width: '1px'
                }
              });
//              var centroidHandle = new Handle(feature._bindDependencies({target: centroid, owner: entity}));
//              centroidHandle.show();
            });

//            var modes = Objects.values(Feature.DisplayMode);
//            var nextIndex = 0;
            setInterval(function() {
//              nextIndex = (nextIndex + 1) % modes.length;
//              var mode = modes[nextIndex];
//              console.log('mode', mode);
//              feature.setDisplayMode(mode);
              console.debug('translate');
              feature.translate(new GeoPoint(0.0001, 0.0001));
            }, 4000);
          }
        });
      });
    }

  })
      ;
})
;

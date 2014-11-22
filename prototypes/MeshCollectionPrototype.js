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
  'atlas/model/Vertex',
  'atlas-cesium/model/Handle',
  'jquery'
], function(ConvexHullGrahamScan, Class, Objects, GeoEntity, Collection, Feature, GeoPoint, Style,
            Colour, Vertex, Handle, $) {

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
            // var c3mlPoint = new GeoPoint([145.2521592379, -37.81075024723, 0.0]);
            var c3mlPoint = new GeoPoint([115.8602151, -31.9441179, 0.0]);

            // var c3mlPoint = new GeoPoint([145.2521592379, -37.81075024723, 0.0]);
            // var diff = featurePoint.subtract(c3mlPoint);
            var collection = new Collection('c1', {entities: ids},
                feature._bindDependencies({show: true}));
            feature.setForm(Feature.DisplayMode.MESH, collection);
            feature.setDisplayMode(Feature.DisplayMode.MESH);
            collection.setCentroid(c3mlPoint);

            // collection.translate(diff);

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

            atlas.publish('camera/zoomTo', {position: centroid});

            feature.setDisplayMode('mesh');

            // Ensure subsequent translations use matrix transformations if they are sufficiently small.
            setTimeout(function() {
              setInterval(function() {
                feature.translate(new GeoPoint(0.0001, 0.0001));
              }, 2000);
            }, 3000);

            // Switch between all modes.
            // var modes = ['footprint', 'extrusion', 'mesh'];
            // var nextIndex = 0;
            // setInterval(function() {
            //   nextIndex = (nextIndex + 1) % modes.length;
            //   var mode = modes[nextIndex];
            //   console.log('mode', mode);
            //   feature.setDisplayMode(mode);
            //   console.debug('translate');
            //   feature.translate(new GeoPoint(0.0001, 0.0001));
            //   // feature.rotate(new Vertex(0, 0, 15));
            // }, 3000);

            // Set up popup for the feature to show for both the mesh and the polygon.
            // atlas.publish('popup/onSelection', {
            //   entity: feature,
            //   content: function(args) {
            //     var entity = args.entity;
            //     return '<div>A brief description of the entity.</div>' + 
            //     '<div>Area: ' + entity.getArea() + '</div>';
            //   },
            //   title: function(args) {
            //     var entity = args.entity;
            //     return 'Entity: ' + entity.getId();
            //   },
            //   onCreate: function(popup) {
            //   }
            // });
          }
        });
      });
    }

  })
      ;
})
;

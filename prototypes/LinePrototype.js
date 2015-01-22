define([
  'atlas/lib/utility/Class',
  'atlas/material/Color',
  'atlas/model/GeoPoint',
  'atlas/model/Line',
  'atlas/material/Style'
], function(Class, Color, GeoPoint, Line, Style) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;

      var lineId = '123';
      atlas.publish('entity/create', {
        id: lineId,
        line: {
          vertices: 'LINESTRING (-37.826731495464358 145.237709744708383,-37.82679037235421 145.237705952915746,-37.826788424406047 145.237562742764595,-37.826747996976231 145.237473553563689,-37.826702438444919 145.237482137149016,-37.82670417818575 145.237710588552915,-37.826731495464358 145.237709744708383)',
          width: 1,
          // width: '5px',
          elevation: 100,
          color: 'green'
        },
        show: true
      });

      var entityManager = atlas._managers.entity;
      var lineFeature = entityManager.getById(lineId);
      var line = lineFeature.getForm();
      line.setElevation(10);
      // line.setWidth(5);
      // line.setWidth('5px');
      console.log('Line length', line.getLength());

      console.log('line json', lineFeature.toJson());

      atlas.publish('camera/zoomTo',
          {position: new GeoPoint({latitude: -37.826731495464358, longitude: 145.237709744708383})});

    }

  });
});

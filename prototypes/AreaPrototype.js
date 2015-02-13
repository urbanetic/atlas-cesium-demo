define([
  'atlas/lib/utility/Class',
], function(Class) {
  return Class.extend({

    atlas: null,

    _init: function(atlas) {
      this.atlas = atlas;
      var entityManager = atlas._managers.entity;

      var someFeature = entityManager.getFeatures()[0];
      someFeature.setSelected(true);

      function testArea() {
        console.log('area', someFeature, someFeature.getArea());
        console.log('area', someFeature, someFeature.getForm().getArea());
      }
      testArea();
      setInterval(testArea, 3000);

    }

  });
});

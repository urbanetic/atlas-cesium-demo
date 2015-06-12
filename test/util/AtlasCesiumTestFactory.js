define([
  'atlas-cesium/core/CesiumAtlas'
], function(CesiumAtlas) {
  return {

    createAtlasCesium: function() {
      var cesiumAtlas = new CesiumAtlas();
      cesiumAtlas.attachTo(document.createElement('div'));
      return cesiumAtlas;
    },

    createManager: function(id) {
      return this.createAtlasCesium().getManager(id);
    }

  }
});

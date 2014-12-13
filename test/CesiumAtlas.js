define([
  'doh/runner',
  'dam/TestCase',
  /* Code under test */
  //'../core/CesiumAtlas'
], function(doh, TestCase, CesiumAtlas) {

  /* Test globals go here */
  var cesiumAtlas;


  /* Begin test case definitions */
  new TestCase({

    name: 'atlas-cesium/CesiumAtlas',

    setUp: function() {
      // summary:
      cesiumAtlas = new CesiumAtlas();
    },

    testAddPolygon: function() {
      // summary:
    },

    testAttachTo: function() {
      // summary:
    }
  }).register(doh);
});


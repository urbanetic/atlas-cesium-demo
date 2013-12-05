define([
  'doh/runner',
  'dam/TestCase',
  /* Code under test */
  '../Polygon',
], function (doh, TestCase, Polygon) {

  /* Test globals go here */
  var polygon; 


  /* Begin test case definitions */
  new TestCase({

    name: 'atlas-cesium/model/Polygon',

    setUp: function () {
      // summary:
      //polygon = new Polygon(id, vertices, args);
    },

    testBuild: function() {
      // summary:
    }
  }).register(doh);
});


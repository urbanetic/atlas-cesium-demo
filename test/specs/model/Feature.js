define([
  'doh/runner',
  'dam/TestCase',
  '../Polygon',
  /* Code under test */
  '../Feature'
], function (doh, TestCase, Polygon, Feature) {
  "use strict";

  /* Test globals go here */
  var feature;

  var id;
  var args;


  /* Begin test case definitions */
  new TestCase({

    name: 'model/Feature',

    setUp: function () {
      // summary:
      id = 12345;
      args = {
        footprint: "POLYGON ((1 2, 3 4))",
        renderManager: {},
        eventManager: {}
      };
      feature = new Feature(id, args);
    },

    tearDown: function () {
      feature = null;
    },

    testCreate: function () {
      doh.assertTrue(feature instanceof Feature, 'feature not valid Feature');
      doh.assertTrue(feature._footprint instanceof Polygon, 'footprint not valid Polygon');
      doh.assertEqual(id, feature.getId());
    }

  }).register(doh);
});


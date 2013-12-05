define([
  'doh/runner',
  'dam/TestCase',
  /* Code under test */
  '../DomManager',
], function (doh, TestCase, DomManager) {

  /* Test globals go here */
  //var atlasManagers;
  //var domManager;


  /* Begin test case definitions */
  new TestCase({

    name: 'atlas-cesium/dom/DomManager',

    setUp: function () {
      // summary:
      atlasManagers = {
        dom: {},
        event: {},
        render: {}
      };
      domManager = new DomManager(atlasManagers);
    },

    tearDown: function () {
      domManager = null;
      atlasManagers.dom = {};
    },

    testCreate: function () {
      doh.assertTrue(domManager instanceof DomManager, 'DomManager not created properly');
      doh.assertTrue(atlasManagers.dom instanceof DomManager, 'atlasManagers reference not created properly');
    },
  }).register(doh);
});


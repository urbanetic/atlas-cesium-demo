define([
  'doh/runner',
  'dam/TestCase',
  /* Code under test */
  '../DomManager'
], function (doh, TestCase, DomManager) {

  /* Test globals go here */
  var managers;
  var domManager;

  /* Begin test case definitions */
  new TestCase({

    name: 'atlas-cesium/dom/DomManager',

    setUp: function () {
      // summary:
      managers = {
        dom: {},
        event: {},
        render: {}
      };
      domManager = new DomManager(managers);
    },

    tearDown: function () {
      domManager = null;
      managers.dom = {};
    },

    testCreate: function () {
      doh.assertTrue(domManager instanceof DomManager, 'DomManager not created properly');
      doh.assertTrue(managers.dom instanceof DomManager, 'managers reference not created properly');
    }
  }).register(doh);
});


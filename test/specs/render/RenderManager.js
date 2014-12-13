define([
  'doh/runner',
  'dam/TestCase',
  'atlas/events/EventManager',
  'atlas-cesium/model/Feature',
  /* Code under test */
  '../RenderManager'
], function(doh, TestCase, EventManager, Feature, RenderManager) {

  /* Test globals go here */
  var managers, renderManager;

  /* Begin test case definitions */
  new TestCase({

    name: 'atlas-cesium/render/RenderManager',

    setUp: function() {
      // summary:
      managers = {
        dom: {},
        event: {},
        render: {}
      };
      //eventManager = new EventManager(managers);
      renderManager = new RenderManager(managers);
    },

    tearDown: function() {
      renderManager = null;
      managers = {
        dom: {},
        event: {},
        render: {}
      };
    },

    testCreate: function() {
      doh.assertTrue(renderManager instanceof RenderManager);
      doh.assertTrue(managers.render == renderManager);
    },

    testAddFeature: function() {
      var args = {
        id: 12345
      };
      // TODO(aramk) Use createFeature on EntityManager instead.
      renderManager.addFeature(args.id, args);
      doh.assertTrue(renderManager._entities[args.id] instanceof Feature);
    }
  }).register(doh);
});


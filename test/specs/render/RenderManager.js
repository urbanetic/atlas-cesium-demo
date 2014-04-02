define([
  'doh/runner',
  'dam/TestCase',
  'atlas/events/EventManager',
  'atlas-cesium/model/Feature',
  /* Code under test */
  '../RenderManager'
], function (doh, TestCase, EventManager, Feature, RenderManager) {

  /* Test globals go here */
  var atlasManagers, renderManager;

  /* Begin test case definitions */
  new TestCase({

    name: 'atlas-cesium/render/RenderManager',

    setUp: function () {
      // summary:
      atlasManagers = {
        dom: {},
        event: {},
        render: {}
      };
      //eventManager = new EventManager(atlasManagers);
      renderManager = new RenderManager(atlasManagers);
    },

    tearDown: function () {
      renderManager = null;
      atlasManagers = {
        dom: {},
        event: {},
        render: {}
      };
    },

    testCreate: function () {
      doh.assertTrue(renderManager instanceof RenderManager);
      doh.assertTrue(atlasManagers.render == renderManager);
    },

    testAddFeature: function () {
      var args = {
        id: 12345
      };
      // TODO(aramk) Use createFeature on EntityManager instead.
      renderManager.addFeature(args.id, args);
      doh.assertTrue(renderManager._entities[args.id] instanceof Feature);
    }
  }).register(doh);
});


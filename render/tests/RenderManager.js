define([
  'doh/runner',
  'dam/TestCase',
  /* Code under test */
  '../RenderManager',
], function (doh, TestCase, RenderManager) {

  /* Test globals go here */
  

  /* Begin test case definitions */
  new TestCase({

    name: 'atlas-cesium/render/RenderManager',

    setUp: function () {
      console.debug('what');
      // summary:
      atlasManagers = {
        dom: {},
        event: {},
        render: {}
      };
      console.debug(atlasManagers);
      renderManager = new RenderManager(atlasManagers);
    },

    tearDown: function () {
      renderManager = null;
    },

    testCreate: function () {
      doh.assertTrue(renderManager instanceof RenderManager);
      doh.assertTrue(atlasManagers.render == renderManager);
    },
  }).register(doh);
});


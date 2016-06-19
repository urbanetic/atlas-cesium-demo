// Meteor package definition.
Package.describe({
  name: 'urbanetic:atlas-cesium',
  version: '0.8.2',
  summary: 'An AGI Cesium <cesiumjs.org> implementation of the Atlas rendering API.',
  git: 'https://bitbucket.org/urbanetic/atlas-cesium.git'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.0');
  api.use('aramk:requirejs@2.1.15_1', ['client', 'server']);
  api.addFiles(['dist/atlas-cesium.min.js'], ['client', 'server']);
  api.addFiles(['dist/resources/atlas-cesium.min.css'], 'client');
});

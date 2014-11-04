// Meteor package definition.
Package.describe({
  name: 'urbanetic:atlas-cesium',
  version: '0.1.0',
  summary: 'An AGI Cesium <cesiumjs.org> implementation of the Atlas rendering API.'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.0');
  api.use('aramk:requirejs', ['client', 'server']);
  api.addFiles(['dist/atlas-cesium.min.js'], ['client', 'server']);
  api.addFiles(['dist/resources/atlas-cesium.min.css'], 'client');
});

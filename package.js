// Meteor package definition.
Package.describe({
  summary: 'An AGI Cesium <cesiumjs.org> implementation of the Atlas rendering API.'
});

Package.onUse(function(api) {
  api.use('aramk:requirejs', ['client', 'server']);
  api.addFiles(['dist/atlas-cesium.min.js'], ['client', 'server']);
  api.addFiles(['dist/resources/atlas-cesium.min.css'], 'client');
});

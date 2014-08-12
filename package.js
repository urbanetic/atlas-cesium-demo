// Meteor package definition.
Package.describe({
  summary: 'An AGI Cesium <cesiumjs.org> implementation of the Atlas rendering API.'
});

Package.on_use(function (api) {
  // Depends on the requirejs package.
  api.use('requirejs', 'client');
  // Make the built source code and styles available for the client.
  api.add_files([
    'dist/atlas-cesium.min.js',
    'dist/resources/atlas-cesium.min.css'
  ], 'client');
});

Package.describe({
  summary: 'An AGI Cesium <cesiumjs.org> implementation of the Atlas rendering API.'
});

Package.on_use(function (api) {
  api.use('requirejs', 'client');
  api.add_files(['dist/atlas-cesium.min.js', 'dist/atlas-cesium.min.css'], 'client');
});

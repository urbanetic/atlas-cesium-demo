var tests = [];
for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/.*Spec\.js$/.test(file)) {
      console.debug('test spec:', file);
      tests.push(file);
    }
  }
}
requirejs.config({
  // Karma serves files from '/base'.
  baseUrl: '/base',

  packages: [
    { name: '../../atlas/lib', location: 'atlas/lib'},
    { name: '../../atlas/assets', location: 'atlas/assets'}, // Only need this for testing
    { name: '../../atlas', location: 'atlas/src'},
    { name: '../../atlas-cesium/cesium', location: 'atlas-cesium/lib/cesium'},
    { name: '../../atlas-cesium/lib', location: 'atlas-cesium/lib'},
    { name: '../../atlas-cesium', location: 'atlas-cesium/src'}
  ],

  // Ask requirejs to load these files.
  deps: tests,

  // Start tests running once requirejs is done.
  callback: window.__karma__.start
});

var tests = [];
var specsConfig = [
  {name: 'camera/Camera', run: false},
  {name: 'model/Ellipse', run: false},
  {name: 'model/Handle', run: false},
  {name: 'model/Mesh', run: false},
  {name: 'render/LocalTerrainData', run: true}
];

var warnings = '\n';
specsConfig.forEach(function(config) {
  if (config.run) {
    tests.push('/base/atlas-cesium/test/specs/' + config.name + 'Spec.js');
  } else {
    warnings += 'Not running test spec: ' + config.name;
    config.fix && (warnings += ', fix: ' + config.fix);
    warnings += '\n';
  }
});
/* global console */
warnings !== '\n' && console.log(warnings);

/* global requirejs,window */
requirejs.config({
  // Karma serves files from '/base'.
  baseUrl: '/base',

  packages: [
    {name: 'jquery', location: 'atlas/lib', main: 'jquery.js'},
    {name: 'atlas/lib', location: 'atlas/lib'},
    {name: 'atlas/lib/utility', location: 'atlas/lib/utility/src'},
    {name: 'atlas/assets', location: 'atlas/assets'}, // Only need this for testing
    {name: 'atlas', location: 'atlas/src'},
    {name: 'atlas-cesium/cesium', location: 'atlas-cesium/lib/cesium'},
    {name: 'atlas-cesium/lib', location: 'atlas-cesium/lib'},
    {name: 'atlas-cesium', location: 'atlas-cesium/src'}
  ],

  // Ask requirejs to load these files.
  deps: tests,

  // Start tests running once requirejs is done.
  callback: window.__karma__.start
});

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
    {name: 'atlas', location: 'atlas/src'},
    {name: 'atlas/lib', location: 'atlas/lib'},
    {name: 'atlas/lib/utility', location: 'atlas/lib/utility/src'},
    {name: 'atlas/assets', location: 'atlas/assets'}, // Only need this for testing
    {name: 'atlas-cesium/cesium', location: 'atlas-cesium/lib/cesium'},
    {name: 'atlas-cesium/lib', location: 'atlas-cesium/lib'},
    {name: 'atlas-cesium', location: 'atlas-cesium/src'},
    {name: 'jquery', location: 'atlas/lib', main: 'jquery'},
    {name: 'underscore', location: 'atlas/lib/underscore', main: 'underscore'},

    // These all belong to subdiv.
    {name: 'atlas/lib/subdiv', location: 'atlas/lib/subdiv/src'},
    {name: 'ConvexHullGrahamScan', location: 'atlas/lib/subdiv/lib', main: 'ConvexHullGrahamScan'},
    {name: 'hull', location: 'atlas/lib/subdiv/lib', main: 'hull'},
    {name: 'jsts', location: 'atlas/lib/subdiv/lib/jsts'},
    {name: 'tinycolor', location: 'atlas/lib/subdiv/lib', main: 'tinycolor'},
    {name: 'utility', location: 'atlas/lib/subdiv/lib/utility/src'},

    // This is the expected name of utm-converter in subdiv.
    {name: 'utm-converter', location: 'atlas/lib', main: 'UtmConverter.js'}
  ],

  // Ask requirejs to load these files.
  deps: tests,

  // Start tests running once requirejs is done.
  callback: window.__karma__.start
});

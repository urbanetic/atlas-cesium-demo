// Build profile for RequireJS.
({
  baseUrl: '../src',
  paths: {
    // Ignore atlas imports since it is packaged separately.
    'atlas': 'empty:',
    'atlas/lib': 'empty:',
    'atlas-cesium': '',
    'atlas-cesium/lib': '../lib',
    // Build only the used Cesium modules.
    'atlas-cesium/cesium': '../lib/cesium'
  },
  name: 'main',
  out: '../dist/atlas-cesium.min.js',
  excludeShallow: ['main']
})

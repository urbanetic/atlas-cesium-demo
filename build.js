// Build profile for RequireJS.
({
  baseUrl: 'src',
  paths: {
    'atlas': 'empty:',
    'atlas/lib': 'empty:',
    'atlas-cesium': '',
    'atlas-cesium/lib': '../lib',
    // Build only the used Cesium modules.
    'atlas-cesium/cesium': '../lib/cesium'
//    'atlas-cesium/cesium': 'empty:'
  },
  name: 'main',
  out: 'dist/atlas-cesium.js',
  excludeShallow: ['main']
})

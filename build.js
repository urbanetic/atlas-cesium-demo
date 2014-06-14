// Build profile for RequireJS.
({
  baseUrl: 'src',
  paths: {
    'atlas': 'empty:',
    'atlas/lib': 'empty:',
    'atlas-cesium': '',
    'atlas-cesium/lib': '../lib',
    'atlas-cesium/cesium': 'empty:'
  },
  name: 'main',
  out: 'dist/atlas-cesium.js',
  excludeShallow: ['main']
})

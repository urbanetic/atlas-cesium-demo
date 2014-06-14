module.exports = function(grunt) {
  var path = require('path'),
      glob = require('glob'),
      fs = require('fs');
  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);
  // Time how long tasks take. Can help when optimizing build times
  //require('time-grunt')(grunt); // Not installed

  var SRC_DIR = 'src';
  var DIST_DIR = 'dist';
  var MAIN_FILE = srcPath('main.js');
  var BUILD_FILE = 'build.js';
  var RE_AMD_MODULE = /\b(?:define|require)\s*\(/;
  var MODULE_NAME = 'atlas-cesium';

  // Define the configuration for all the tasks.
  grunt.initConfig({
    // What?
    yeoman: {
      app: require('./bower.json').appPath || 'app',
      dist: 'dist'
    },

    shell: {
      installBowerDep: {
        options: {
          stdout: true
        },
        command: [
          'echo "----- Installing bower dependencies -----"',
          'bower install',
          'echo "----- Bower dependencies installed  -----"'
        ].join('&&')
      },
      buildCesium: {
        options: {
          stdout: true, stdin: true
        },
        command: [
          'echo "----- Building Cesium               -----"',
              'cd ' + path.join('lib', 'cesium'),
          path.join('.', 'Tools', 'apache-ant-1.8.2', 'bin', 'ant build'),
              'cd ' + path.join('..', '..'),
          'echo "----- Cesium built                  -----"'
        ].join('&&')
      },
      jsdoc: {
        command: [
          'echo "----- Building JSDoc                -----"',
          'jsdoc -c jsdoc.conf.json',
          'echo "----- JSDoc built                   -----"'
        ].join('&&')
      },
      build: {
        options: {
          stdout: true
        },
        command: [
          'echo "----- Building -----"',
              'node node_modules/requirejs/bin/r.js -o ' + BUILD_FILE
        ].join('&&')
      }
    },

    copy: {
      overrideCesium: {
        files: [
          {
            expand: true,
            cwd: path.join('src', 'cesium-overrides'),
            src: '**/*.js',
            dest: path.join('.', 'lib', 'cesium'),
            ext: '.js'
          }
        ]
      },
      build: {
        options: {
          processContent: function(content) {
            return content.replace(/(\bbaseUrl\s*:\s*['"])/, '$1../')
                .replace(/(\bout\s*:\s*['"])/, '$1../');
          }
        },
        files: [
          {src: BUILD_FILE, dest: distPath(BUILD_FILE)}
        ]
      }
    }
  });

  // TODO(aramk) Duplicated from atlas.
  grunt.registerTask('compile-imports', 'Builds a RequireJS script to import all source files '
      + 'which are AMD modules.', function() {
    console.log('Compiling modules for importing...');
    var findResults = findAmdModules(SRC_DIR),
        modules = findResults.modules,
        notModules = findResults.notModules;

    modules = modules.filter(function(file) {
      return srcPath(file) !== MAIN_FILE;
    });
    if (modules.length > 0) {
      console.log('Modules:');
      modules.forEach(function(file) {
        console.log(' ' + file);
      });
    }
    if (notModules.length > 0) {
      console.log('\nNot Modules:');
      notModules.forEach(function(file) {
        console.log(' ' + file);
      });
    }
    console.log('');

    var moduleIds = modules.map(function(module) {
      return MODULE_NAME + '/' + module.replace(/\.js$/, '');
    });
    var mainFile = '// This file is generated automatically - avoid modifying manually.\n' +
        "require(['" + moduleIds.join("', '") + "']);\n";
    console.log('Writing to', MAIN_FILE);
    fs.writeFileSync(MAIN_FILE, mainFile);

    // Compile unused imports to ignore from the build.
//    console.log('Compiling external imports...');
//    var externalImports = [];
//    modules.forEach(function(module) {
//      findAmdImports(readFile(srcPath(module))).forEach(function(moduleId) {
//        if (/(^atlas\/)|(^atlas-cesium\/cesium\/)/.test(moduleId)) {
//          externalImports.push(moduleId);
//        }
//      });
//    });
//    console.log('Found', externalImports.length, 'external imports');
//    var RE_EXCLUDE_SHALLOW = /\bexcludeShallow\s*:\s*\[([^\]]+)\]/;
//    replaceFile(distPath(BUILD_FILE), function(data) {
//      return data.replace(RE_EXCLUDE_SHALLOW, function(m) {
//        return m.replace(/\]$/, ", '" + externalImports.join("', '") + "']");
//      })
//    });

    console.log('Compilation complete');
  });

  grunt.registerTask('install', ['shell:installBowerDep', 'shell:buildCesium']);
  grunt.registerTask('doc', ['shell:jsdoc']);
  grunt.registerTask('build', [/*'copy:build',*/ 'compile-imports', 'shell:build']);

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // AUXILIARY
  //////////////////////////////////////////////////////////////////////////////////////////////////

  var RE_MODULE_IMPORTS = /\bdefine\s*\(\s*(\[[^\]]+\])\s*,\s*function\b/;

  // TODO(aramk) Duplicated from atlas - refactor to allow sharing, perhaps in a bower repo.

  function findAmdModules(dir) {
    var files = glob.sync('**/*.js', {cwd: dir});
    var modules = [];
    var notModules = [];
    files.forEach(function(file) {
      var target = isAmdModule(path.join(dir, file)) ? modules : notModules;
      target.push(file);
    });
    modules.sort();
    notModules.sort();
    return {
      modules: modules,
      notModules: notModules
    };
  }

  function findAmdImports(module) {
    var moduleMatch = module.match(RE_MODULE_IMPORTS);
    var importsStr = moduleMatch[1];
    importsStr = replaceQuotes(importsStr);
    var importNames = [];
    importsStr.replace(/'([^']+)'(?:\s*,)?/g, function(m1, m2, offset, string) {
      importNames.push(m2);
    });
    return importNames;
  }

  function replaceQuotes(str) {
    return str.replace(/"/g, "'");
  }

  function isAmdModule(file) {
    var data = readFile(file);
    return RE_AMD_MODULE.test(data);
  }

  function readFile(file) {
    return fs.readFileSync(file, {encoding: 'utf-8'});
  }

  function replaceFile(file, callback) {
    var data = readFile(file);
    fs.writeFileSync(file, callback(data));
  }

  function _prefixPath(dir, args) {
    var prefixedArgs = Array.prototype.slice.apply(args);
    prefixedArgs.unshift(dir);
    return path.join.apply(path, prefixedArgs);
  }

  function srcPath() {
    return _prefixPath(SRC_DIR, arguments);
  }

  function distPath() {
    return _prefixPath(DIST_DIR, arguments);
  }

};

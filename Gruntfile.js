/* global module,require,console */
module.exports = function(grunt) {
  var path = require('path');
  var glob = require('glob');
  var fs = require('fs');
  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);
  // Time how long tasks take. Can help when optimizing build times
  //require('time-grunt')(grunt); // Not installed

  var MODULE_NAME = 'atlas-cesium';
  var SRC_DIR = 'src';
  var LIB_DIR = 'lib';
  var DIST_DIR = 'dist';
  var BUILD_DIR = 'build';
  var RESOURCES_DIR = 'resources';
  var RESOURCES_BUILD_PATH = distPath(RESOURCES_DIR);
  var MAIN_FILE = srcPath('main.js');
  var BUILD_FILE = buildPath('build.js');
  var RE_AMD_MODULE = /\b(?:define|require)\s*\(/;
  var CESIUM_DIR = libPath('cesium');
  var CESIUM_SRC_DIR = cesiumPath('Source');
  var BUILD_SRC_DIR = distPath('cesium', 'Source');
  var CESIUM_WORKERS_BUILD_DIR = 'CesiumWorkers';
  var CESIUM_WORKERS_BUILD_PATH = cesiumPath('Build', CESIUM_WORKERS_BUILD_DIR);
  var STYLE_FILE = MODULE_NAME + '.less';
  var STYLE_BUILD_FILE = MODULE_NAME + '.min.css';
  var STYLE_BUILD_FILE_PATH = path.join(RESOURCES_BUILD_PATH, STYLE_BUILD_FILE);
  var LCOV_REPORT_PATH = 'coverage/lcov.dat';

  // Define config for copy:resources.
  var resourceCopy = [];
  ['Assets', 'Widgets'].forEach(function(dir) {
    resourceCopy.push({
      expand: true,
      cwd: path.join(CESIUM_SRC_DIR, dir),
      src: '**/*',
      dest: path.join(BUILD_SRC_DIR, dir)
    });
  });
  resourceCopy.push({
    expand: true,
    cwd: RESOURCES_DIR,
    src: '**/*',
    dest: RESOURCES_BUILD_PATH
  });

  require('logfile-grunt')(grunt, {filePath: buildPath('./grunt.log'), clearLogFile: true});
  // Define the configuration for all the tasks.
  grunt.initConfig({

    shell: {
      options: {
        stdout: true,
        stderr: true,
        failOnError: true
      },
      // Installs all NodeJS dependencies.
      installNpmDep: {
        command: 'npm install --cache-min 999999999'
      },

      // Installs all Bower dependencies.
      installBowerDep: {
        command: 'bower install --allow-root'
      },

      // Updates all NodeJS dependencies.
      updateNpmDep: {
        command: 'npm update'
      },

      // Updates all Bower dependencies.
      updateBowerDep: {
        command: 'bower update --allow-root'
      },

      // Builds the Cesium source code.
      buildCesiumDev: {
        options: {
          stdout: false
        },
        command: [
              'cd ' + cesiumPath(),
          // TODO(aramk) This can break on 32-bit systems. Maybe use
          // https://www.npmjs.org/package/ant.
          path.join('.', 'Tools', 'apache-ant-1.8.2', 'bin', 'ant build')
        ].join('&&')
      },

      // Builds the Cesium workers.
      buildWorkers: {
        options: {
          // TODO(aramk) This task often fails before it is complete on the server, so even though
          // default timeout should be zero, this is more explicit.
          // See https://github.com/sindresorhus/grunt-shell
          stdout: false, stderr: true, execOptions: {timeout: 0}
        },
        command: [
              'cd ' + cesiumPath(),
              path.join('.', 'Tools', 'apache-ant-1.8.2', 'bin', 'ant') +
              ' combineJavaScript.combineCesiumWorkers' +
              ' -Doptimize=uglify2 -DrelativeCombineOutputDirectory=' +
              path.join('..', 'Build', CESIUM_WORKERS_BUILD_DIR)
        ].join('&&')
      },

      // Compiles JSDoc from JS source files.
      jsdoc: {
        options: {
          stdout: true
        },
        command: [
          'rm -rf docs',
              path.join('node_modules', '.bin', 'jsdoc') + ' -c jsdoc.conf.json -l'
        ].join('&&')
      },

      // Compile JS source files.
      build: {
        options: {
          stdout: false, stderr: true, failOnError: true
        },
        command: 'node node_modules/requirejs/bin/r.js -o ' + BUILD_FILE + ' optimize=none'
      },

      buildMinify: {
        options: {
          stdout: false, stderr: true, failOnError: true
        },
        command: 'node node_modules/requirejs/bin/r.js -o ' + BUILD_FILE
      }
    },

    copy: {
      resources: {
        files: resourceCopy
      },
      workers: {
        files: [
          {
            expand: true,
            cwd: path.join(CESIUM_WORKERS_BUILD_PATH, 'Workers'),
            src: '**/*',
            dest: path.join(BUILD_SRC_DIR, 'Workers')
          }
        ]
      }
    },

    less: {
      dist: {
        options: {
          cleancss: true,
          relativeUrls: true
        },
        files: [
          {
            src: path.join(RESOURCES_DIR, STYLE_FILE),
            dest: STYLE_BUILD_FILE_PATH
          }
        ]
      }
    },

    clean: {
      dist: {
        files: [
          {
            dot: true,
            cwd: DIST_DIR,
            src: [
              distPath('**', '*')
            ]
          }
        ]
      },
      resourcesLess: {
        // Remove the .less source file from the copied resources, leaving everything else.
        files: [
          {
            expand: true,
            cwd: RESOURCES_BUILD_PATH,
            src: STYLE_FILE
          }
        ]
      }
    },

    karma: {
      options: {
        configFile: 'test/karma.conf.js',
        runnerPort: 9878,
      },
      unit: {
        browsers: ['Chrome', 'Firefox']
      },
      local: {
        browsers: ['Firefox'],
        preprocessors: []
      },
      continuous: {
        singleRun: true,
        browsers: ['PhantomJS']
      },
      debug: {
        // Click DEBUG on Karma page and open Dev Tools. Refresh to re-run.
        browsers: [],
        singleRun: false,
        // Ensures source files are readable.
        preprocessors: []
      }
    },

    sed: {
      // The karma coverage outputs source file names (SF) as "./atlas/src/..."
      // Sonar-runner expects source file names to be "src/..."
      fixCoverageOutput: {
        path: LCOV_REPORT_PATH,
        pattern: './atlas-cesium/src',
        replacement: 'src'
      }
    }
  });

  // TODO(aramk) Duplicated from atlas.
  grunt.registerTask('compile-imports', 'Builds a RequireJS script to import all source files ' +
      'which are AMD modules.', function() {
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
    console.log('Compilation complete');
  });

  grunt.registerTask('build-workers', 'Builds the Cesium workers if necessary', function() {
    var BUILD_PATH = libPath('cesium', 'Build', CESIUM_WORKERS_BUILD_DIR);
    if (fs.existsSync(BUILD_PATH)) {
      console.log('Cesium workers already built. Phew!');
    } else {
      grunt.task.run('shell:buildWorkers');
    }
  });

  grunt.registerTask('fix-build-style', 'Fix the Cesium style import', function() {
    writeFile(STYLE_BUILD_FILE_PATH, function(data) {
      return data.replace("@import '../lib/cesium", "@import '../cesium");
    });
  });

  // TODO(aramk) Only works with non-minified build.
  grunt.registerTask('fix-module-url', 'Fix the Cesium module URL', function() {
    writeFile(distPath(MODULE_NAME + '.min.js'), function(data) {
      // Ensure Module URL can be changed even in RequireJS environment.
      return data.replace('= buildModuleUrlFromRequireToUrl', '= buildModuleUrlFromBaseUrl');
    });
  });

  grunt.registerTask('install', 'Installs dependencies.',
      ['shell:installBowerDep', 'shell:buildCesiumDev']);
  grunt.registerTask('update', 'Updates dependencies.',
      ['shell:updateNpmDep', 'shell:updateBowerDep']);
  grunt.registerTask('build', 'Builds the app into a distributable package.', function() {
    var args = arguments,
        tasks = [],
        addTasks = function() {
          Array.prototype.slice.apply(arguments).forEach(function(task) {
            tasks.push(task);
          });
        },
        hasArgs = function(arg) {
          return Object.keys(args).some(function(argIndex) {
            var value = args[argIndex];
            return value === arg;
          });
        };
    addTasks('compile-imports', 'clean:dist');
    hasArgs('no-minify') ? addTasks('shell:build') : addTasks('shell:buildMinify');
    addTasks('build-workers', 'copy:workers', 'copy:resources', 'clean:resourcesLess', 'less',
        'fix-build-style');
    hasArgs('module-url') && addTasks('fix-module-url');
    console.log('Running tasks', tasks);
    tasks.forEach(function(task) {
      grunt.task.run(task);
    });
  });
  grunt.registerTask('doc', 'Generates documentation.', ['shell:jsdoc']);

  grunt.registerTask('test', 'Runs unit tests', ['force:karma:unit', 'sed:fixCoverageOutput']);

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

  function writeFile(file, data) {
    if (typeof data === 'function') {
      data = data(readFile(file));
    }
    fs.writeFileSync(file, data);
  }

  function _prefixPath(dir, args) {
    var prefixedArgs = Array.prototype.slice.apply(args);
    prefixedArgs.unshift(dir);
    return path.join.apply(path, prefixedArgs);
  }

  function srcPath() {
    return _prefixPath(SRC_DIR, arguments);
  }

  function libPath() {
    return _prefixPath(LIB_DIR, arguments);
  }

  function distPath() {
    return _prefixPath(DIST_DIR, arguments);
  }

  function buildPath() {
    return _prefixPath(BUILD_DIR, arguments);
  }

  function cesiumPath() {
    return _prefixPath(CESIUM_DIR, arguments);
  }

};

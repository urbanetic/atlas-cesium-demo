module.exports = function(grunt) {
  var path = require('path');
  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  //require('time-grunt')(grunt); // Not installed?

  pkg: grunt.file.readJSON('package.json');

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
            'cd lib/cesium',
            path.join('.', 'Tools', 'apache-ant-1.8.2', 'bin', 'ant build'),
            'cd ' + path.join('..', '..'),
            'echo "----- Cesium built                  -----"',
        ].join('&&')
      },
      jsdoc: {
        command: [
            'echo "----- Building JSDoc                -----"',
            'jsdoc -c jsdoc.conf.json',
            'echo "----- JSDoc built                   -----"'
        ].join('&&')
      }
    },

    copy: {
     overrideCesium: {
       files: [
         {
           expand: true,
           cwd: 'src/cesium-overrides/',
           src: '**/*.js',
           dest: './lib/cesium/',
           ext: '.js'
         }
       ]
     }
    }
  });

  grunt.registerTask('install', ['shell:installBowerDep', 'shell:buildCesium']);
  grunt.registerTask('doc', ['shell:jsdoc']);
  grunt.registerTask('default', 'install');
};

// vim: tabstop:2,shiftwidth:2

module.exports = function(grunt) {
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
          stdout: true
        },
        command: [
            'echo "----- Building Cesium              -----"',
            'cd lib/cesium',
            './Tools/apache-ant-1.8.2/bin/ant build',
            'cd ../..',
            'echo "----- Cesium built                 -----"'
        ].join('&&')
      }
    },

    jsdoc : {
      dist : {
        src: ['src/**/*.js'],
        options: {
          configure: './jsdoc.conf.json'
        }
      }
    }

//    // Watches
//    watch: {
//    },
//
//    // Grunt server settings
//    connect: {
//
//    }
  });

  grunt.registerTask('build', ['shell:installBowerDep', 'shell:buildCesium', 'jsdoc']);
  grunt.registerTask('docs', ['jsdoc']);
  grunt.registerTask('default', 'build');
};

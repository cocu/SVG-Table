module.exports = function (grunt) {
    var pkg = grunt.file.readJSON('package.json');
    grunt.initConfig({
        pkg: pkg,
        concat: {
            files: {
                src: 'src/*.js',
                dest: 'dist/svg-table.js'
            }
        },
        uglify: {
            options:{
                banner: "// SVG-Table @version\n// author: cocu\n// license: Apache v2\n// https://github.com/cocu/SVG-Table\n"
                    .replace('@version',pkg.version)
            },
            dist: {
                files: {
                    'dist/svg-table-min.js': 'dist/svg-table.js'
                }
            }
        }
    });


    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['concat', 'uglify']);
}
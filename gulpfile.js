require('es6-promise').polyfill();
var gulp = require('gulp');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var envify = require('loose-envify');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var livereload = require('gulp-livereload');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var uglify = require('gulp-uglify');
var babel = require('babelify');
var minifyCSS = require('gulp-minify-css');
var concat = require('gulp-concat');
// var lrload = require('livereactload');
var postcss = require('gulp-postcss');
var autoprefixer = require('gulp-autoprefixer');

var autoprefixerOptions = {
  browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
};

const STATIC_DIR = 'static/';
const APP_LOCATION = STATIC_DIR + 'js/redux/init.jsx';
const COMPILED_NAME = 'application.js';
const COMPILED_LOCATION = STATIC_DIR + 'js/gulp';

const CSS_FILES = STATIC_DIR + 'css/timetable/**/*.css';

const isProd = process.env.NODE_ENV === "production";
const isDev = process.env.NODE_ENV === "development";

gulp.task('css', function(){
    return gulp.src(CSS_FILES)
        .pipe(gulpif(isProd,minifyCSS()))
        .pipe(concat('style.min.css'))
        .pipe(gulpif(isProd,autoprefixer()))
        .pipe(gulp.dest('static/css/gulp'))
        .pipe(livereload());
});

gulp.task('csswatch', function () {
    livereload.listen();
    gulp.watch(CSS_FILES, ['css']);
});


gulp.task('watch', ['csswatch']);
gulp.task('default', ['watch']);

gulp.task('build', function() { return compile(); });
gulp.task('default', ['csswatch']);


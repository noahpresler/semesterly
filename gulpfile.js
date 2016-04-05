var gulp = require('gulp');
var gutil = require('gulp-util');
var envify = require('loose-envify');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var uglify = require('gulp-uglify');
var babel = require('babelify');
var minifyCSS = require('gulp-minify-css');

const STATIC_DIR = 'static/';
const APP_LOCATION = STATIC_DIR + 'js/redux/init.jsx';
const COMPILED_NAME = 'application.js';
const COMPILED_LOCATION = STATIC_DIR + 'js/gulp';

const CSS_FILES = STATIC_DIR + 'css/new_timetable/*.css';

function compile(watch) {
    bundler = watchify(
        browserify({
            entries: [APP_LOCATION],
            debug: true,
            // Allow importing from the following extensions
            extensions: [' ', 'js', 'jsx'],
            transform: [
              [babel, {presets: ["es2015", "react"]} ],
              [envify, {global: true, NODE_ENV: 'production'}]]
        })
    );
  function rebundle() {
    bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source(COMPILED_NAME))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(streamify(uglify()))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(COMPILED_LOCATION));
  }

  if (watch) {
    bundler.on('update', function() {
    gutil.log(gutil.colors.magenta('Recompiling Javascript...'));
      rebundle();
    gutil.log(gutil.colors.green('Compilation complete!'));
    });
  }

  rebundle();
}

function watch() {
  return compile(true);
};

gulp.task('jswatch', function() { 
  return watch(); 
});

gulp.task('css', function(){
    return gulp.src('static/css/new_timetable/*')
        .pipe(minifyCSS())
        .pipe(gulp.dest('static/css/gulp'));
});

gulp.task('csswatch', function () {
    gulp.watch(CSS_FILES, ['css']);
});


gulp.task('build', function() { return compile(); });
gulp.task('default', ['jswatch', 'csswatch']);

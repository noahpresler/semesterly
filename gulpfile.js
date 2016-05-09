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
var lrload = require('livereactload');

const STATIC_DIR = 'static/';
const APP_LOCATION = STATIC_DIR + 'js/redux/init.jsx';
const COMPILED_NAME = 'application.js';
const COMPILED_LOCATION = STATIC_DIR + 'js/gulp';

const CSS_FILES = STATIC_DIR + 'css/timetable/**/*.css';

const isProd = process.env.NODE_ENV === "production";
const isDev = process.env.NODE_ENV === "development";

function compile(watch) {
    bundler = watchify(
        browserify({
            entries: [APP_LOCATION],
            debug: true,
            // Allow importing from the following extensions
            extensions: ['js', 'jsx'],
            plugin: isProd ? [] : [ lrload ],
            transform: [
              [babel, {presets: ["es2015", "react"]} ],
              [envify, {global: true, NODE_ENV: process.env.NODE_ENV}]
            ]
        })
    );
  function rebundle() {
    bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source(COMPILED_NAME))
      .pipe(buffer())
      .pipe(gulpif(isDev, sourcemaps.init({ loadMaps: true })))
      .pipe(gulpif(isProd, streamify(uglify())))
      .pipe(gulpif(isDev, sourcemaps.write('./')))
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
    return gulp.src(CSS_FILES)
        .pipe(minifyCSS())
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest('static/css/gulp'))
        .pipe(livereload());
});

gulp.task('csswatch', function () {
    livereload.listen();
    gulp.watch(CSS_FILES, ['css']);
});


gulp.task('watch', ['watchify', 'csswatch']);
gulp.task('default', ['watch']);

gulp.task('timer', function () {
return gulp.src('./static/js/misc/jhu_timer.jsx')
    .pipe(concat('timer.js'))
    .pipe(react())
    .pipe(gulp.dest('static/js/misc'));
});

// gulp.task('analytics', function () {
// return gulp.src('./static/js/analytics/**')
//     .pipe(concat('analytics_application.js'))
//     .pipe(react())
//     .pipe(gulp.dest('static/js/gulp'));
// });

gulp.task('build', function() { return compile(); });
gulp.task('default', ['jswatch', 'csswatch']);

const gulp = require('gulp');
const babel = require('gulp-babel');
const react = require('gulp-react');
const watch = require('gulp-watch');
const concat = require('gulp-concat');
const batch = require('gulp-batch');

gulp.task('transform', function() {
  return gulp.src('static/js/timetable/*.jsx')
  .pipe(babel({
        presets: ['es2015', 'react']
    }))
  .pipe(concat('application.js'))
  .pipe(gulp.dest('static/js/gulp'));
});
gulp.task('watcher', function () {
    watch('static/js/timetable/*.jsx', batch(function(events, done) {
        gulp.start('transform', done);
    }));
});

gulp.task('default', ['watcher', 'transform'], function(){});


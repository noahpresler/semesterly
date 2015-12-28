const gulp = require('gulp');
// const babel = require('gulp-babel');
// const react = require('gulp-react');
// const watch = require('gulp-watch');
// const concat = require('gulp-concat');
// const batch = require('gulp-batch');

/* new */

const gutil = require('gulp-util');
const source = require('vinyl-source-stream');
const browserify = require('browserify');
const watchify = require('watchify');
const reactify = require('reactify');
// const babelify = require('babelify');


gulp.task('default', function() {
	var bundler = watchify(browserify({
		entries: ['./static/js/new_timetable/app.jsx'],
		transform: [reactify],
		extensions: ['.jsx'],
		debug: true,
		cache: {},
		packageCache: {},
		fullPaths: true
	}));

	function build(file) {
		if (file) gutil.log('Recompiling ' + file);
		var result = bundler
		.bundle()
		.on('error', gutil.log.bind(gutil, 'Browserify Error'))
		.pipe(source('application.js'))
		.pipe(gulp.dest('static/js/gulp'));
		gutil.log('Compilation complete');
		return result;
	};
	build();
	bundler.on('update', build);
});

// gulp.task('transform', function() {
//   return gulp.src('static/js/new_timetable/*.jsx')
//   .pipe(babel({
//         presets: ['es2015', 'react']
//     }))
//   .pipe(concat('application.js'))
//   .pipe(gulp.dest('static/js/gulp'));
// });
// gulp.task('watcher', functi on () {
//     watch('static/js/new_timetable/*.jsx', batch(function(events, done) {
//         gulp.start('transform', done);
//     }));
// });

// gulp.task('default', ['watcher', 'transform'], function(){});


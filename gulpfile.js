var gulp = require('gulp');
const babel = require('gulp-babel');
const react = require('gulp-react');
const watch = require('gulp-watch');

gulp.task('default', function() {
	return gulp.src('static/js/timetable/*.jsx')
	.pipe(watch('static/js/timetable/*.jsx'))
	.pipe(babel({
		presets: ['es2015', 'react']
	}))
	.pipe(gulp.dest('static/js/gulp'));
});


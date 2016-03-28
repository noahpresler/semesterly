const gulp = require('gulp');
// const babel = require('gulp-babel');
const react = require('gulp-react');
// const watch = require('gulp-watch');
const concat = require('gulp-concat');
// const batch = require('gulp-batch');

/* new */

const gutil = require('gulp-util');
const source = require('vinyl-source-stream');
const browserify = require('browserify');
const watchify = require('watchify');
const reactify = require('reactify');
// const babelify = require('babelify');
const uglify = require('gulp-uglify');
const vbuffer = require('vinyl-buffer');
// const streamify = require('gulp-streamify');
const minifyCSS = require('gulp-minify-css');


var staticDirectory = './static/',

    // Source and target JS files for Browserify
    jsMainFile      = staticDirectory + 'js/new_timetable/app.jsx',
    jsBundleFile    = 'application.js',
    jsDest          = staticDirectory + 'js/gulp',

    // Source and target LESS files
    cssMainFile     = staticDirectory + 'less/styles.less',
    cssFiles        = staticDirectory + 'css/new_timetable/*.css';


// Browserify bundler, configured for reactify with sources having a .jsx extension
var bundler = browserify({
    entries: [jsMainFile],
    transform: [reactify],
    extensions: ['.jsx'],
    debug: true,
    cache: {}, packageCache: {}, fullPaths: true // for watchify
});

// Build JavaScript using Browserify
gulp.task('js', function() {
    return bundler
        .bundle()
        .pipe(source(jsMainFile))
        .pipe(vbuffer())
        .pipe(uglify())
        .pipe(gulp.dest(jsDest));
});

gulp.task('css', function(){
    return gulp.src('static/css/new_timetable/*')
        .pipe(minifyCSS())
        .pipe(gulp.dest('static/css/gulp'));
});

gulp.task('watchify', function() {
    var watcher  = watchify(bundler);
    return watcher
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .on('update', function () {
        watcher.bundle()
        .pipe(source(jsBundleFile))
        .pipe(vbuffer())
		.pipe(uglify().on('error', gutil.log.bind(gutil, 'Uglify Error')))
        .pipe(gulp.dest(jsDest));
        gutil.log("Javascript compilation complete!");
    })
    .bundle() // Create the initial bundle when starting the task
    .pipe(source(jsBundleFile))
    .pipe(gulp.dest(jsDest));
});

gulp.task('csswatch', function () {
    gulp.watch(cssFiles, ['css']);
});

gulp.task('watch', ['watchify', 'csswatch']);
gulp.task('default', ['watch']);



// gulp.task('analytics', function () {
// return gulp.src('./static/js/analytics/**')
//     .pipe(concat('analytics_application.js'))
//     .pipe(react())
//     .pipe(gulp.dest('static/js/gulp'));
// });


let gulp = require('gulp');
let cleanCSS = require('gulp-clean-css');
var concatCss = require('gulp-concat-css');
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);
let concat = require('gulp-concat');

// define the default task and add the watch task to it
gulp.task('default', ['watch']);


gulp.task('compress', function () {
    return gulp.src('js_long/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('js'))
});

gulp.task('watch', function() {
    gulp.watch('js/restaurant_info.js', ['compress']);
});

gulp.task('combine-css', () => {
    return gulp.src('css/*.css')
        .pipe(concatCss("main.css"))
        .pipe(gulp.dest("css/"));
});

gulp.task('minify-css', () => {
    return gulp.src('styles/main.css')
        .pipe(cleanCSS({compatibility: 'ie11'}))
        .pipe(gulp.dest('css/main.css'));
});
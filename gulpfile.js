let gulp = require('gulp');
// let babel = require('gulp-babel');
// let uglify = require('gulp-uglify');
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);
let concat = require('gulp-concat');

gulp.task('minify', () => {
    return gulp.src('js/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify())
    // [...]
});

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
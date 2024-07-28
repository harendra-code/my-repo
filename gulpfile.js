"use strict";

var gulp = require('gulp'),
  sass = require('gulp-sass')(require('sass')),
  del = require('del'),
  uglify = require('gulp-uglify'),
  cleanCSS = require('gulp-clean-css'),
  rename = require("gulp-rename"),
  merge = require('merge-stream'),
  htmlreplace = require('gulp-html-replace'),
  autoprefixer = require('gulp-autoprefixer'),
  browserSync = require('browser-sync').create(),
  sourcemaps = require('gulp-sourcemaps');

// Clean task
gulp.task('clean', function() {
  return del(['dist', 'assets/css/app.css']);
});

// Copy third party libraries
gulp.task('vendor:js', function() {
  return gulp.src([
    './node_modules/bootstrap/dist/js/*',
    './node_modules/@popperjs/core/dist/umd/popper.*'
  ])
    .pipe(gulp.dest('assets/js/vendor'));
});

gulp.task('vendor:fonts', function() {
  return  gulp.src([
    './node_modules/bootstrap-icons/**/*',
    '!./node_modules/bootstrap-icons/package.json',
    '!./node_modules/bootstrap-icons/README.md',
  ])
    .pipe(gulp.dest('assets/fonts/bootstrap-icons'));
});

gulp.task('vendor', gulp.parallel('vendor:fonts', 'vendor:js'));

// Copy Bootstrap SCSS(SASS) from node_modules to /assets/scss/bootstrap
gulp.task('bootstrap:scss', function() {
  return gulp.src(['./node_modules/bootstrap/scss/**/*'])
    .pipe(gulp.dest('assets/scss/bootstrap'));
});

// Compile SCSS(SASS) files
gulp.task('scss', gulp.series('bootstrap:scss', function compileScss() {
  return gulp.src(['assets/scss/*.scss'])
    .pipe(sourcemaps.init())
    .pipe(sass.sync({
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('assets/css'))
}));

// Minify CSS
gulp.task('css:minify', gulp.series('scss', function cssMinify() {
  return gulp.src("assets/css/*.css")
    .pipe(sourcemaps.init())
    .pipe(cleanCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/assets/css'))
    .pipe(browserSync.stream());
}));

// Minify JS
gulp.task('js:minify', function () {
  return gulp.src(['assets/js/app.js'])
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/assets/js'))
    .pipe(browserSync.stream());
});

// Replace HTML block
gulp.task('replaceHtmlBlock', function () {
  return gulp.src(['*.html'])
    .pipe(htmlreplace({
      'css': '/my-repo/assets/css/app.min.css',
      'js': '/my-repo/assets/js/app.min.js'
    }))
    .pipe(gulp.dest('dist/'));
});

// Configure BrowserSync
gulp.task('dev', function browserDev(done) {
  browserSync.init({
    server: {
      baseDir: "./"
    }
  });
  gulp.watch(['assets/scss/*.scss','assets/scss/**/*.scss','!assets/scss/bootstrap/**'], gulp.series('css:minify', function cssBrowserReload (done) {
    browserSync.reload();
    done(); 
  }));
  gulp.watch('assets/js/app.js', gulp.series('js:minify', function jsBrowserReload (done) {
    browserSync.reload();
    done();
  }));
  gulp.watch(['*.html']).on('change', browserSync.reload);
  done();
});

// Build task
gulp.task("build", gulp.series(gulp.parallel('css:minify', 'js:minify', 'vendor'), 'vendor:build', function copyAssets() {
  return gulp.src([
    '*.html',
    "assets/img/**"
  ], { base: './'})
    .pipe(gulp.dest('dist'));
}));

// Default task
gulp.task("default", gulp.series("clean", 'build', 'replaceHtmlBlock'));

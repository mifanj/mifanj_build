const { src, dest, series, parallel, watch } = require("gulp")

const del = require("del")
const browserSync = require("browser-sync")
const bs = browserSync.create()

const loadPlugins = require("gulp-load-plugins")
const plugins = loadPlugins()

const cwd = process.cwd()
let config = {}
try {
    const loadConfig = require(`${cwd}/build.config.js`)
    config = Object.assign({}, config, loadConfig)
} catch (e) {
    throw e
}

const style = () => {
    return src("src/assets/styles/*.scss", { base: "src" })
        .pipe(plugins.sass({ outputStyle: "expanded"} ))
        .pipe(dest(".tmp"))
        .pipe(bs.reload({ stream: true }))
}

const script = () => {
    return src("src/assets/scripts/*.js", { base: "src" })
        .pipe(plugins.babel({ presets: [require("@babel/preset-env")] }))
        .pipe(dest(".tmp"))
        .pipe(bs.reload({ stream: true }))
}

const page = () => {
    return src("src/*.html", { base: "src" })
        .pipe(plugins.swig({ data: config.data }))
        .pipe(dest(".tmp"))
        .pipe(bs.reload({ stream: true }))
}

const image = () => {
    return src("src/assets/images/*", { base: "src" })
        .pipe(plugins.imagemin())
        .pipe(dest(".tmp"))
}

const font = () => {
    return src("src/assets/fonts/*", { base: "src" })
        .pipe(plugins.imagemin())
        .pipe(dest("dist"))
}

const extra = () => {
    return src("public/**", { base: "." })
        .pipe(dest("dist"))
}

const clean = () => {
    return del(".tmp").then(del("dist"))
}

const serve = () => {
    watch("src/assets/styles/*.scss", style)
    watch("src/assets/scripts/*.js", script)
    watch("src/*.html", page)
    // watch("src/assets/images/*", image)
    // watch("src/assets/fonts/*", font)
    // watch("public/**", extra)
    watch([
        "src/assets/images/*",
        "src/assets/fonts/*",
        "public/**"
    ], bs.reload)

    bs.init({
        notify: false,
        port: 2000,
        // files: "dist/**",
        server: {
            baseDir: ["dist", "src", "public"],
            routes: {
                "/node_modules": "node_modules"
            }
        }
    })
}

const useref = () => {
    return src(".tmp/**", {base: ".tmp"})
        .pipe(plugins.useref({ searchPath: [".tmp", "."] }))
        .pipe(plugins.if(/\.js$/, plugins.uglify()))
        .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
        .pipe(plugins.if(/\.html$/, plugins.htmlmin({
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true
        })))
        .pipe(dest("dist"))
}

const compile = parallel(style, script, page)
const build = series(
    clean, 
    parallel(
        series(compile, useref), 
        image, 
        font, 
        extra
    )
)
const develop = series(compile, serve)

module.exports = {
    build,
    develop
}
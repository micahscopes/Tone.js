// Rollup plugins
import babel from 'rollup-plugin-babel';
import includePaths from 'rollup-plugin-includepaths';
// import commonjs from 'rollup-plugin-commonjs';

let includePathOptions = {
    include: {},
    paths: ['Tone'],
    external: [],
    extensions: ['.js', '.json', '.html']
};

export default {
  entry: 'Tone/main.js',
  dest: 'build/index.es.js',
  format: 'es',
  plugins: [
    includePaths(includePathOptions),
  // sourceMap: 'inline',
  // plugins: [
  //   resolve({
  //     jsnext: true,
  //     main: true,
  //     browser: true,
  //     preferBuiltins: true  // Default: true
  //   }),
    // commonjs(),
    // babel({
    //   presets: [
    //     ['es2015', { modules: true } ]
    //   ],
    // }),
  ],
};

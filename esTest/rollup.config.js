// Rollup plugins
import babel from 'rollup-plugin-babel';
// import includePaths from 'rollup-plugin-includepaths';
// import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'main.js',
  dest: 'bundle.js',
  format: 'iife',
  moduleName: "Tone",
  plugins: [
    // includePaths(includePathOptions),
  // sourceMap: 'inline',
  // plugins: [
     resolve({
       modules: true,
       jsnext: true,
       main: true,
       browser: true,
       preferBuiltins: true  // Default: true
     }),
    // commonjs(),
    // babel({
    //   presets: [
    //     ['es2015', { modules: false } ]
    //   ],
    // }),
  ],
};

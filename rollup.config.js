// Rollup plugins
import babel from 'rollup-plugin-babel';
// import resolve from 'rollup-plugin-node-resolve';
// import commonjs from 'rollup-plugin-commonjs';

import includePaths from 'rollup-plugin-includepaths';

let includePathOptions = {
    include: {},
    paths: ['Tone'],
    external: [],
    extensions: ['.js', '.json', '.html']
};

export default {
  entry: 'Tone/core.js',
  dest: 'build/index.js',
  format: 'iife',
  moduleName: "Tone",
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
    babel({
      presets: [
        ['es2015', { modules: false } ]
      ],
      // plugins: [
      //   'transform-class-properties',
      //   'external-helpers',
      // ],
      // exclude: 'node_modules/babel-runtime/**',
    }),
  ],
};

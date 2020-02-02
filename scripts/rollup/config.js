import path from 'path';
import * as R from 'ramda';
import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import bundleSize from 'rollup-plugin-size';
import gzip from 'rollup-plugin-gzip';
import replace from 'rollup-plugin-replace';
import minimist from 'minimist';

import { CJS, ESM, IIFE, UMD, bundles, fixtures } from '../bundles.js';

const formatOptions = {
  [CJS]: { ext: '.js' },
  [ESM]: { ext: '.js' },
  [IIFE]: { ext: '.min.js' },
  [UMD]: { ext: '.js' }
};

const argv = minimist(process.argv.slice(2));

const requestedBundleTypes = (argv.type || '')
  .split(',')
  .map(type => type.toUpperCase());
const requestedBundleNames = (argv.name || '').split(',');

let bs = argv.fixtures ? fixtures : bundles;
bs = argv.all ? bundles.concat(fixtures) : bs;

// For every type in bundle.types creates a new bundle obj.
const unbundle = ({ formats, ...rest }) =>
  formats.map(format => ({ ...rest, format }));
const allBundles = R.chain(unbundle, bs).filter(
  ({ name, format }) => !shouldSkipBundle(name, format)
);

function shouldSkipBundle(bundleName, bundleType) {
  if (requestedBundleTypes.length > 0) {
    const isAskingForDifferentType = requestedBundleTypes.every(
      requestedType => bundleType.indexOf(requestedType) === -1
    );
    if (isAskingForDifferentType) {
      return true;
    }
  }
  if (requestedBundleNames.length > 0) {
    const isAskingForDifferentNames = requestedBundleNames.every(
      requestedName => bundleName.indexOf(requestedName) === -1
    );
    if (isAskingForDifferentNames) {
      return true;
    }
  }
  return false;
}

function getConfig(options) {
  const {
    name,
    input,
    dest,
    format,
    external = [],
    sourcemap = true,
    extend = false
  } = options;
  const output = dest
    ? `${dest(format)}/${name}${formatOptions[format].ext}`
    : path.join(
        path.dirname(input),
        `../dist/${name}${formatOptions[format].ext}`
      );

  const replacePeersForESM = external.map((name, i) => {
    return (
      ESM === format &&
      i % 2 == 0 &&
      replace({
        delimiters: ['', ''],
        [`from '${name}'`]: `from '${external[i + 1]}'`
      })
    );
  });

  return {
    input,
    external,
    watch: {
      clearScreen: false
    },
    output: {
      format,
      sourcemap,
      extend,
      file: output,
      name: options.global,
      exports: options.exports,
      strict: false, // Remove `use strict;`
      interop: false, // Remove `r=r&&r.hasOwnProperty("default")?r.default:r;`
      freeze: false, // Remove `Object.freeze()`
      esModule: false // Remove `esModule` property
    },
    plugins: [
      bundleSize({
        columnWidth: 25
      }),
      nodeResolve(),
      [UMD, IIFE].includes(format) && babel(options.babel),
      [ESM, UMD, IIFE].includes(format) &&
        terser({
          sourcemap: true,
          warnings: true,
          compress: false,
          mangle: false
          // {
          //   passes: 2
          // },
          // mangle: {
          //   properties: {
          //     regex: /^_/
          //   }
          // },
          // nameCache: {
          //   props: {
          //     cname: 6,
          //     props: {
          //       $_tag: '__t',
          //       $_props: '__p',
          //       $_children: '__c'
          //     }
          //   }
          // }
        }),
      ...replacePeersForESM,
      options.gzip && gzip()
    ].filter(Boolean),
    onwarn: function(warning) {
      // https://github.com/rollup/rollup/wiki/Troubleshooting#this-is-undefined
      if (
        ['THIS_IS_UNDEFINED', 'UNKNOWN_OPTION', 'MISSING_GLOBAL_NAME'].includes(
          warning.code
        )
      )
        return;

      console.error(warning.message);
    }
  };
}

export default allBundles.map(getConfig);

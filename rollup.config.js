import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { terser } from "rollup-plugin-terser";
export default {
    input: 'src/index.ts', // our source file
    output: [

        {
            file: pkg.module,
            sourcemap: true,
            format: 'esm' // the preferred format
        },
    ],
    external: [
        ...Object.keys(pkg.dependencies || {})
    ],
    plugins: [
        typescript({
            typescript: require('typescript'),
        }),
        sourceMaps(),
        terser() // minifies generated bundles
    ]
};
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/conductor/initialise.ts',
  output: {
    file: 'dist-conductor/index.js',
    format: 'iife',
    sourcemap: true
  },
  plugins: [
    nodeResolve(),
    typescript({ tsconfig: 'tsconfig.conductor.json', outDir: undefined, declaration: false }),
    terser()
  ]
}

import * as fs from 'node:fs'

/**
 * Build script to convert all classfiles in a directory to base64 and write them to a file.
 * e.g. node dist/jvm/utils/build path/to/classfiles
 *
 * only includes classfiles with package names starting with the strings in the include array
 * writes to $OUTDIR/classfiles.js. OUTDIR can be changed by setting the OUTDIR variable below.
 */

const CLASSFILE_PATH = process.argv[2] ?? ''
const OUTDIR = 'dist/jvm/utils'
const include = ['java', 'sun/misc', 'modules']

function cf2b64(path: string): string {
  const buffer = fs.readFileSync(path, null)
  return buffer.toString('base64')
}

const items: { [file: string]: string } = {}

function _readAll(currentPath: string) {
  fs.readdirSync(currentPath).forEach(file => {
    const filepath = currentPath + '/' + file
    if (fs.statSync(filepath).isDirectory()) {
      _readAll(filepath)
    }

    if (file.endsWith('.class')) {
      const pkg = currentPath.slice(CLASSFILE_PATH.length + 1)
      include.reduce(
        (accumulator, currentValue) => accumulator || pkg.startsWith(currentValue),
        false
      ) && (items[`${pkg.length ? pkg + '/' : ''}${file}`] = cf2b64(filepath))
    }
  })
}

export default function build() {
  console.log(process.argv)
  _readAll(CLASSFILE_PATH)
  fs.writeFileSync(
    OUTDIR + '/classfiles.js',
    `"use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.default = ${JSON.stringify(items)};`
  )
  fs.writeFileSync(
    OUTDIR + '/classfiles.d.ts',
    `declare const _default: {[key: string]: string;}; export default _default;`
  )
  console.log(`Wrote ${Object.keys(items).length} classfiles to ${OUTDIR}`)
}

build()

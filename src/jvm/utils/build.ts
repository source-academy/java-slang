import * as fs from 'node:fs'
import * as path from 'node:path'
import { MODULE_DIRS } from '../../compiler/import/lib-closure'
// eslint-disable-next-line @typescript-eslint/no-var-requires
import guaranteedClassFiles = require('../../compiler/import/generated-lib-classes.json')

/**
 * Build script to convert classfiles to base64 and write them to a file.
 * e.g. node dist/jvm/utils/build path/to/classfiles [path/to/std-lib]
 *
 * Two sources are merged into $OUTDIR/classfiles.js:
 *
 *   1. A recursive walk of argv[2], including every classfile whose package
 *      name starts with one of the `include` prefixes (legacy behaviour).
 *
 *   2. Every class in `generated-lib-classes.json` - the exact set the compiler
 *      and type checker verify imports against (see compiler/import/lib-closure).
 *      These are guaranteed to be present so the JVM can always link what the
 *      compiler accepts. Missing ones are resolved from the std-lib module dirs
 *      (argv[3], default "std-lib").
 *
 * OUTDIR can be changed by setting the OUTDIR variable below.
 */

const CLASSFILE_PATH = process.argv[2] ?? ''
const STD_LIB_ROOT = process.argv[3] ?? 'std-lib'
const OUTDIR = 'dist/jvm/utils'
const include = ['java', 'sun', 'modules', 'jdk']

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

/**
 * Locates a `pkg/Name.class` relative path, trying the walked classpath first
 * and then each std-lib module directory.
 */
function resolveGuaranteed(relPath: string): string | null {
  const candidates = [
    CLASSFILE_PATH ? path.join(CLASSFILE_PATH, relPath) : relPath,
    ...MODULE_DIRS.map(moduleDir => path.join(STD_LIB_ROOT, moduleDir, relPath))
  ]
  return candidates.find(candidate => fs.existsSync(candidate)) ?? null
}

function _addGuaranteed(): { added: number; unresolved: string[] } {
  const unresolved: string[] = []
  let added = 0
  for (const relPath of guaranteedClassFiles) {
    if (items[relPath]) continue
    const file = resolveGuaranteed(relPath)
    if (file === null) {
      unresolved.push(relPath)
      continue
    }
    items[relPath] = cf2b64(file)
    added++
  }
  return { added, unresolved }
}

export default function build() {
  console.log(process.argv)
  if (CLASSFILE_PATH) _readAll(CLASSFILE_PATH)
  const walked = Object.keys(items).length

  const { added, unresolved } = _addGuaranteed()

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
  console.log(
    `Wrote ${Object.keys(items).length} classfiles to ${OUTDIR} ` +
      `(${walked} from walk, ${added} added from the compiler class set)`
  )
  if (unresolved.length > 0) {
    console.warn(
      `Warning: ${unresolved.length} class(es) in the compiler set could not be ` +
        `located and are missing from the bundle:`
    )
    for (const relPath of unresolved) console.warn(`  - ${relPath}`)
  }
}

build()

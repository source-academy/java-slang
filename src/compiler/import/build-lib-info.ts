import * as fs from 'node:fs'
import * as path from 'node:path'
import { LibInfoMap } from './class-meta'
import { closureClassFilePaths, computeClosure } from './lib-closure'

/**
 * Regenerates `generated-lib-info.json` (descriptor-level metadata for the
 * supported standard-library classes) from a JDK class tree.
 *
 *   node dist/compiler/import/build-lib-info.js [path/to/class-tree]
 *
 * Defaults to `rt/` (an extracted Java 8 rt.jar) so the compiler's view of the
 * standard library matches the class file version it emits and the classes the
 * JVM runs.
 *
 * Also writes `generated-lib-classes.json`: the same class list as
 * `pkg/Name.class` paths, for the JVM class-file bundling step to consume so the
 * compiler and the JVM stay in lock-step.
 */

const CLASS_ROOT = process.argv[2] ?? 'rt'
const OUT_DIR = 'src/compiler/import'
const METADATA_OUT = path.join(OUT_DIR, 'generated-lib-info.json')
const CLASSLIST_OUT = path.join(OUT_DIR, 'generated-lib-classes.json')

/** Sorts the map by key and its member arrays for deterministic diffs. */
function sortMetadata(metadata: LibInfoMap): LibInfoMap {
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)
  const sorted: LibInfoMap = {}
  for (const key of Object.keys(metadata).sort()) {
    const entry = metadata[key]
    sorted[key] = {
      ...entry,
      interfaces: [...entry.interfaces].sort(),
      fields: [...entry.fields].sort(byName),
      methods: [...entry.methods].sort(byName)
    }
  }
  return sorted
}

export default function buildLibInfo(): void {
  if (!fs.existsSync(CLASS_ROOT)) {
    throw new Error(
      `class tree not found at "${CLASS_ROOT}". Pass the path to an extracted ` +
        `Java 8 rt.jar tree as an argument.`
    )
  }

  const closure = computeClosure(CLASS_ROOT)
  const metadata = sortMetadata(closure.metadata)

  fs.writeFileSync(METADATA_OUT, JSON.stringify(metadata, null, 2) + '\n')
  fs.writeFileSync(CLASSLIST_OUT, JSON.stringify(closureClassFilePaths(closure), null, 2) + '\n')

  console.log(`Wrote ${Object.keys(metadata).length} classes to ${METADATA_OUT}`)
  if (closure.unresolved.length > 0) {
    console.warn(
      `Warning: ${closure.unresolved.length} class(es) could not be resolved and were skipped:`
    )
    for (const name of closure.unresolved.sort()) console.warn(`  - ${name}`)
  }
}

buildLibInfo()

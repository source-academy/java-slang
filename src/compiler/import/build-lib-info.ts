import * as fs from 'node:fs'
import * as path from 'node:path'
import { LibInfoMap } from './class-meta'
import { closureClassFilePaths, computeClosure } from './lib-closure'

/**
 * Regenerates `generated-lib-info.json` (descriptor-level metadata for the
 * supported standard-library classes) from the `std-lib` submodule.
 *
 *   node dist/compiler/import/build-lib-info.js [path/to/std-lib]
 *
 * Also writes `generated-lib-classes.json`: the same class list as
 * `pkg/Name.class` paths, for the JVM class-file bundling step to consume so the
 * compiler and the JVM stay in lock-step.
 */

const STD_LIB_ROOT = process.argv[2] ?? 'std-lib'
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
  if (!fs.existsSync(STD_LIB_ROOT)) {
    throw new Error(
      `std-lib not found at "${STD_LIB_ROOT}". Pass its path as an argument or ` +
        `run "git submodule update --init --recursive".`
    )
  }

  const closure = computeClosure(STD_LIB_ROOT)
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

import * as fs from 'node:fs'
import * as path from 'node:path'
import { ClassMeta, LibInfoMap } from './class-meta'
import { extractClassMetaFromBuffer } from './extract-metadata'

/**
 * Build-time helpers (Node only) for deciding which standard-library classes
 * the compiler / type checker / JVM need to know about, and for reading their
 * metadata out of a JDK class tree.
 *
 * The class-tree root is a flat package tree, e.g. an extracted Java 8 rt.jar:
 * `rt/java/lang/Object.class`.
 *
 * This module is intentionally **not** imported by any runtime code: it pulls in
 * `node:fs`. Runtime code consumes the generated `generated-lib-info.json`.
 */

/**
 * Classes the Source Java subset is allowed to import by fully-qualified name.
 * The transitive closure over superclasses / interfaces is added automatically,
 * so only "entry point" types need listing here.
 */
export const SEED_CLASSES: string[] = [
  // java.lang core types
  'java/lang/Object',
  'java/lang/String',
  'java/lang/StringBuilder',
  'java/lang/StringBuffer',
  'java/lang/System',
  'java/lang/Math',
  'java/lang/StrictMath',
  'java/lang/Number',
  'java/lang/Boolean',
  'java/lang/Byte',
  'java/lang/Short',
  'java/lang/Character',
  'java/lang/Integer',
  'java/lang/Long',
  'java/lang/Float',
  'java/lang/Double',
  'java/lang/Void',
  'java/lang/Comparable',
  'java/lang/CharSequence',
  'java/lang/Iterable',
  'java/lang/Runnable',
  'java/lang/Enum',
  'java/lang/Throwable',
  // java.io
  'java/io/PrintStream',
  // java.util
  'java/util/Arrays',
  'java/util/Objects'
]

/**
 * A package whose top-level class files (non-recursive, nested classes excluded)
 * are added to the seed set when `keep(simpleName)` returns true.
 */
export interface SeedPackage {
  internalPackage: string
  keep: (simpleName: string) => boolean
}

/**
 * Bulk-seed the `java.lang` throwable hierarchy without listing ~50 classes by
 * hand. Everything else in `java.lang` (JDK internals such as `StringLatin1`,
 * `CharacterData*`, `FdLibm`, ...) is intentionally left out and, if genuinely
 * needed, must be added to `SEED_CLASSES`.
 */
export const SEED_PACKAGES: SeedPackage[] = [
  {
    internalPackage: 'java/lang/',
    keep: name => name.endsWith('Exception') || name.endsWith('Error')
  }
]

const classFileRelPath = (internalName: string) => internalName + '.class'

/** Resolves an internal class name to an absolute `.class` path, or `null`. */
export function resolveClassFile(classRoot: string, internalName: string): string | null {
  const candidate = path.join(classRoot, classFileRelPath(internalName))
  return fs.existsSync(candidate) ? candidate : null
}

/** Lists the top-level classes (no `$`) in a package that pass `keep`. */
function listPackageClasses(classRoot: string, seed: SeedPackage): string[] {
  const packageDir = path.join(classRoot, seed.internalPackage)
  if (!fs.existsSync(packageDir)) return []
  const found = new Set<string>()
  for (const entry of fs.readdirSync(packageDir)) {
    if (!entry.endsWith('.class') || entry.includes('$')) continue
    const simpleName = entry.slice(0, -'.class'.length)
    if (seed.keep(simpleName)) found.add(seed.internalPackage + simpleName)
  }
  return [...found]
}

export interface ClosureResult {
  /** Metadata for every class in the closure, keyed by internal name. */
  metadata: LibInfoMap
  /** Seed / dependency class names that could not be found under the class root. */
  unresolved: string[]
}

export interface ComputeClosureOptions {
  /**
   * Also follow class references found anywhere a *seed* class's constant
   * pool (not just `superClass`/`interfaces`) - i.e. follow "implementation
   * dependencies": classes a seed's method body happens to call into (e.g.
   * `Arrays.sort` -> `DualPivotQuicksort`/`TimSort`/`ComparableTimSort`) that
   * are not part of any supertype relationship.
   *
   * Deliberately depth-1: only applied to the initial seed set
   * (`SEED_CLASSES`/`SEED_PACKAGES`/`extraSeeds`), never to classes
   * discovered transitively (via superclass/interface *or* a previous
   * implementation dependency). A real JDK classfile's constant pool
   * references far more than any single simplified-JVM program ever
   * executes - `java/lang/String`/`Throwable`/`Class`'s method bodies alone
   * transitively touch HTTP, X.509 certificates, serialization, NIO files,
   * and `java.time`/`java.util.stream` once followed without a depth limit
   * (empirically: ~3500 classes, most of them never reachable at runtime
   * through this JVM's actual execution paths). One hop from the classes the
   * compiler/JVM already knows are entry points keeps this bounded while
   * still fixing the reported class of bug (a seed's own direct helper is
   * missing), since those helpers are themselves small and self-contained.
   *
   * Must stay `false` (the default) for `build-lib-info.ts`: the type
   * checker's allow-list may only contain classes user Java source can
   * legally name, and `java.util.DualPivotQuicksort` is never one of those.
   * `build.ts` opts in, since the JVM bundle must contain every class the
   * JDK bytecode it ships might execute, named or not.
   */
  followImplementationDependencies?: boolean
}

/**
 * Computes the set of standard-library classes reachable from the seeds by
 * following superclass and interface edges (and, if asked, each seed's own
 * direct implementation dependencies - see `ComputeClosureOptions`), and
 * extracts metadata for each.
 *
 * @param extraSeeds Additional seed classes to include beyond `SEED_CLASSES` /
 * `SEED_PACKAGES`, without affecting the compiler's own allow-list - e.g. the
 * JVM's unconditional bootstrap classes (see `build.ts`), which the type
 * checker has no reason to expose to user code.
 */
export function computeClosure(
  classRoot: string,
  extraSeeds: string[] = [],
  options: ComputeClosureOptions = {}
): ClosureResult {
  const metadata: LibInfoMap = {}
  const unresolved: string[] = []

  const initialSeeds = [...SEED_CLASSES, ...extraSeeds]
  for (const pkg of SEED_PACKAGES) {
    initialSeeds.push(...listPackageClasses(classRoot, pkg))
  }
  // Fixed up front, independent of traversal order, so "is this class a seed"
  // doesn't depend on which edge happens to reach it first.
  const seedSet = new Set(initialSeeds)

  const queue: string[] = [...initialSeeds]
  const seen = new Set<string>()
  while (queue.length > 0) {
    const internalName = queue.shift() as string
    if (seen.has(internalName)) continue
    seen.add(internalName)

    const file = resolveClassFile(classRoot, internalName)
    if (file === null) {
      unresolved.push(internalName)
      continue
    }

    const followImplementationDeps =
      options.followImplementationDependencies && seedSet.has(internalName)

    let meta: ClassMeta
    try {
      meta = extractClassMetaFromBuffer(fs.readFileSync(file), {
        includeReferencedClasses: followImplementationDeps
      })
    } catch (e) {
      throw new Error(`Failed to parse ${file}: ${(e as Error).message}`)
    }

    metadata[internalName] = meta
    const implementationDeps = followImplementationDeps ? meta.referencedClasses ?? [] : []
    for (const dep of [meta.superClass, ...meta.interfaces, ...implementationDeps]) {
      if (dep !== null && !seen.has(dep)) queue.push(dep)
    }
  }

  return { metadata, unresolved }
}

/** Returns the closure's class names as `pkg/Name.class` paths for JVM bundling. */
export function closureClassFilePaths(closure: ClosureResult): string[] {
  return Object.keys(closure.metadata).map(classFileRelPath).sort()
}

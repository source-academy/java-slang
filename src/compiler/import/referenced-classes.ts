import { ClassFile } from '../../ClassFile/types'
import { CONSTANT_TAG } from '../../ClassFile/constants/constants'
import { ConstantClassInfo, ConstantUtf8Info } from '../../ClassFile/types/constants'

/**
 * Normalizes a `CONSTANT_Class` entry's name to the internal name of a real
 * classfile, or `null` if it doesn't denote one.
 *
 * `CONSTANT_Class` entries are sometimes array *descriptors* (e.g. the class
 * entry backing `anewarray [Ljava/lang/String;` is named `[Ljava/lang/String;`,
 * not `java/lang/String`) rather than plain internal names. Array classes and
 * primitive types are synthesized by the class loader at runtime, not read
 * from a `.class` file (see `AbstractClassLoader._getClass`), so:
 *  - leading `[` (array dimensions) are stripped;
 *  - if what remains is `L<name>;`, `<name>` is the real dependency (the
 *    array's component type, which *does* need a classfile);
 *  - if what remains is a single primitive type code (`I`, `J`, `Z`, ...),
 *    there is no classfile dependency at all.
 * A non-array entry (no leading `[`) is used as-is.
 */
function normalizeClassEntryName(rawName: string): string | null {
  const stripped = rawName.replace(/^\[+/, '')
  if (stripped === rawName) return rawName // not an array descriptor
  if (stripped.length === 1) return null // primitive component type
  if (stripped.startsWith('L') && stripped.endsWith(';')) {
    return stripped.slice(1, -1)
  }
  return null // defensive: malformed/unexpected descriptor shape
}

/**
 * Every class this classfile's constant pool names, normalized to internal
 * class names - a superset of `superClass` / `interfaces` that also covers
 * classes referenced only from method/field bodies (`new`, `invokestatic`,
 * `checkcast`, catch types, `invokedynamic` bootstrap args, ...), since javac
 * always backs such references with a direct `CONSTANT_Class` entry.
 *
 * Index 0 is skipped: the constant pool is 1-indexed, with a dummy sentinel
 * (itself tagged `Class`, with `nameIndex: 0`) occupying slot 0 - see
 * `readConstants.ts`.
 *
 * Deduplicated and sorted for deterministic output.
 */
export function collectReferencedClassNames(cf: ClassFile): string[] {
  const names = new Set<string>()
  for (let index = 1; index < cf.constantPool.length; index++) {
    const entry = cf.constantPool[index]
    if (entry.tag !== CONSTANT_TAG.Class) continue
    const classInfo = entry as ConstantClassInfo
    const rawName = (cf.constantPool[classInfo.nameIndex] as ConstantUtf8Info).value
    const normalized = normalizeClassEntryName(rawName)
    if (normalized !== null) names.add(normalized)
  }
  return [...names].sort()
}

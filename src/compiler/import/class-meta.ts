/**
 * Descriptor-level metadata for a single standard-library class, extracted
 * directly from its `.class` file. This is the shape stored in
 * `generated-lib-info.json` and consumed by the compiler symbol table and the
 * type checker's standard-library environment.
 */

export interface MemberMeta {
  /** Simple member name, e.g. `println`, `out`, `<init>`. */
  name: string
  /** Raw JVM descriptor, e.g. `(Ljava/lang/String;)V`, `Ljava/io/PrintStream;`. */
  descriptor: string
  /** Raw `access_flags` bitfield (see `METHOD_FLAGS` / `FIELD_FLAGS`). */
  accessFlags: number
}

export interface ClassMeta {
  /** Internal (slash-separated) binary name, e.g. `java/lang/NullPointerException`. */
  name: string
  /** Raw `access_flags` bitfield (see `ACCESS_FLAGS`). */
  accessFlags: number
  /** Internal name of the direct superclass, or `null` for `java/lang/Object`. */
  superClass: string | null
  /** Internal names of directly implemented interfaces. */
  interfaces: string[]
  fields: MemberMeta[]
  methods: MemberMeta[]
}

/** Map from internal class name to its metadata. */
export type LibInfoMap = { [internalName: string]: ClassMeta }

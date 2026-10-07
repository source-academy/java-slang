import * as fs from 'node:fs'
import { computeClosure } from '../../compiler/import/lib-closure'

/**
 * Regenerates `stdlib-classfiles.ts`: a base64 map of every JDK classfile the
 * JVM may need to load, from a JDK class tree.
 *
 *   node dist/jvm/utils/build.js [path/to/class-tree]
 *
 * Defaults to `rt/` (an extracted Java 8 rt.jar), matching build-lib-info.ts so
 * the compiler, type checker and JVM all target the same class file version.
 *
 * The bundle covers the compiler's supported closure (see lib-closure.ts)
 * plus `JVM_BOOTSTRAP_SEEDS` below: everything real JDK 8 bytecode pulls in
 * before user code ever runs, starting from the handful of classes
 * `jvm.ts`'s `run()` loads directly (`java/lang/Thread`, `Class`,
 * `ClassLoader`, `ThreadGroup`, `sun/misc/Unsafe`) and fanning out through
 * `System.initializeSystemClass()` and `ClassLoader.getSystemClassLoader()`'s
 * real static-init chain (array superinterfaces, reflection, NIO charsets,
 * `sun.misc.Launcher`'s class-path scanning, ...). This list was discovered
 * empirically (run `node dist/jvm/utils/run.js` against a trivial Main.java
 * and add whatever "class not found in bundle" names) - there's no static
 * way to derive it since the compiler's own closure only follows
 * superclass/interface edges, not the classes a method body happens to
 * reference. Unlike `generated-lib-info.json`,
 * this output is consumed at runtime (statically imported by both the Node
 * `run.ts` CLI and the browser Conductor evaluator), so it's committed rather
 * than regenerated in CI, same as `generated-lib-info.json`.
 */

const CLASS_ROOT = process.argv[2] ?? 'rt'
const OUT_FILE = 'src/jvm/utils/stdlib-classfiles.ts'

const JVM_BOOTSTRAP_SEEDS = [
  'java/lang/Thread',
  'java/lang/Class',
  'java/lang/ClassLoader',
  'java/lang/ThreadGroup',
  'sun/misc/Unsafe',
  'java/lang/Cloneable',
  'java/io/ObjectStreamField',
  'java/lang/String$CaseInsensitiveComparator',
  'java/lang/StackTraceElement',
  'java/lang/RuntimePermission',
  'java/util/ArrayList',
  'java/security/AccessController',
  'java/util/Collections',
  'java/security/AccessControlContext',
  'java/util/Collections$EmptySet',
  'java/util/Collections$EmptyList',
  'java/util/Properties',
  'java/util/Collections$EmptyMap',
  'java/util/Hashtable$Entry',
  'java/util/Collections$UnmodifiableRandomAccessList',
  'sun/misc/VM',
  'java/util/Hashtable$EntrySet',
  'java/util/Collections$SynchronizedSet',
  'java/util/Hashtable$Enumerator',
  'sun/misc/Version',
  'java/io/FileInputStream',
  'java/io/FileDescriptor',
  'java/io/FileDescriptor$1',
  'sun/misc/SharedSecrets',
  'sun/reflect/Reflection',
  'java/util/HashMap',
  'java/util/HashMap$Node',
  'java/io/FileOutputStream',
  'java/io/BufferedInputStream',
  'java/util/concurrent/atomic/AtomicReferenceFieldUpdater',
  'java/util/concurrent/atomic/AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl',
  'java/security/PrivilegedActionException',
  'java/util/concurrent/atomic/AtomicReferenceFieldUpdater$AtomicReferenceFieldUpdaterImpl$1',
  'java/lang/Class$3',
  'java/lang/Class$ReflectionData',
  'java/lang/ref/SoftReference',
  'java/lang/ref/ReferenceQueue',
  'java/lang/ref/ReferenceQueue$Null',
  'java/lang/ref/ReferenceQueue$Lock',
  'java/lang/Class$Atomic',
  'java/lang/reflect/Field',
  'java/lang/reflect/Constructor',
  'java/security/ProtectionDomain',
  'sun/reflect/generics/repository/ClassRepository',
  'sun/reflect/ReflectionFactory',
  'java/lang/Class$AnnotationData',
  'sun/reflect/annotation/AnnotationType',
  'java/lang/ClassValue$ClassValueMap',
  'java/lang/reflect/ReflectPermission',
  'sun/reflect/ReflectionFactory$GetReflectionFactoryAction',
  'java/lang/reflect/Modifier',
  'java/lang/reflect/ReflectAccess',
  'sun/reflect/misc/ReflectUtil',
  'java/io/BufferedOutputStream',
  'java/io/UnsupportedEncodingException',
  'java/io/OutputStreamWriter',
  'sun/nio/cs/StreamEncoder',
  'java/nio/charset/Charset',
  'java/nio/charset/IllegalCharsetNameException',
  'sun/nio/cs/StandardCharsets',
  'sun/nio/cs/StandardCharsets$Aliases',
  'sun/nio/cs/StandardCharsets$Classes',
  'sun/nio/cs/StandardCharsets$Cache',
  'java/lang/ThreadLocal',
  'java/util/concurrent/atomic/AtomicInteger',
  'sun/security/action/GetPropertyAction',
  'sun/nio/cs/UTF_8',
  'java/lang/Class$1',
  'java/lang/reflect/InvocationTargetException',
  'java/nio/charset/Charset$ExtendedProviderHolder',
  'sun/reflect/ReflectionFactory$1',
  'java/nio/charset/Charset$ExtendedProviderHolder$1',
  'sun/reflect/ConstructorAccessorImpl',
  'java/nio/charset/UnsupportedCharsetException',
  'java/security/cert/Certificate',
  'sun/reflect/NativeConstructorAccessorImpl',
  'java/util/Vector',
  'sun/reflect/DelegatingConstructorAccessorImpl',
  'sun/nio/cs/UTF_8$Encoder',
  'java/nio/charset/CodingErrorAction',
  'java/nio/ByteBuffer',
  'java/nio/HeapByteBuffer',
  'java/nio/Bits',
  'java/nio/ByteOrder',
  'java/util/concurrent/atomic/AtomicLong',
  'java/nio/Bits$1',
  'java/io/BufferedWriter',
  'java/lang/Terminator',
  'java/lang/Terminator$1',
  'sun/misc/Signal',
  'sun/misc/OSEnvironment',
  'java/lang/System$2',
  'java/util/Stack',
  'sun/misc/Launcher',
  'sun/misc/Launcher$Factory',
  'sun/misc/Launcher$ExtClassLoader',
  'sun/security/util/Debug',
  'java/lang/ClassLoader$ParallelLoaders',
  'java/util/WeakHashMap$Entry',
  'java/util/Collections$SetFromMap',
  'java/util/WeakHashMap$KeySet',
  'java/net/URLClassLoader$7',
  'sun/misc/Launcher$ExtClassLoader$1',
  'java/io/File',
  'java/net/URL',
  'java/security/ProtectionDomain$JavaSecurityAccessImpl',
  'java/security/ProtectionDomain$2',
  'java/security/CodeSource',
  'java/security/ProtectionDomain$Key',
  'java/security/Principal',
  'java/util/concurrent/ConcurrentHashMap',
  'java/lang/Runtime',
  'java/util/concurrent/ConcurrentHashMap$Segment',
  'java/util/concurrent/ConcurrentHashMap$Node',
  'java/util/concurrent/ConcurrentHashMap$CounterCell',
  'java/util/concurrent/ConcurrentHashMap$KeySetView',
  'java/util/concurrent/ConcurrentHashMap$ValuesView',
  'java/util/concurrent/ConcurrentHashMap$EntrySetView',
  'java/util/HashSet',
  'sun/misc/URLClassPath',
  'sun/net/www/protocol/jar/Handler',
  'sun/misc/Launcher$AppClassLoader',
  'sun/misc/Launcher$AppClassLoader$1',
  'java/lang/SystemClassLoaderAction',
  'java/io/InterruptedIOException',
  'java/nio/CharBuffer',
  'java/nio/HeapCharBuffer',
  'java/lang/ThreadDeath',
  'java/nio/charset/CoderResult',
  'java/nio/BufferUnderflowException',
  'java/nio/charset/CoderResult$1',
  'java/nio/BufferOverflowException',
  'java/lang/Throwable$WrappedPrintStream',
  'java/nio/charset/CoderResult$2'
]

function cf2b64(filePath: string): string {
  return fs.readFileSync(filePath).toString('base64')
}

function build() {
  const closure = computeClosure(CLASS_ROOT, JVM_BOOTSTRAP_SEEDS)
  if (closure.unresolved.length > 0) {
    console.warn(`Could not resolve under ${CLASS_ROOT}: ${closure.unresolved.join(', ')}`)
  }

  const items: { [file: string]: string } = {}
  for (const internalName of Object.keys(closure.metadata).sort()) {
    items[internalName + '.class'] = cf2b64(`${CLASS_ROOT}/${internalName}.class`)
  }

  fs.writeFileSync(
    OUT_FILE,
    `// Generated by \`node dist/jvm/utils/build.js\` from a JDK class tree. Do not edit by hand.\n` +
      `const stdlibClassfiles: { [path: string]: string } = ${JSON.stringify(items)}\n\n` +
      `export default stdlibClassfiles\n`
  )
  console.log(`Wrote ${Object.keys(items).length} classfiles to ${OUT_FILE}`)
}

build()

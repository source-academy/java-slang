import { Lib } from '../jni'

import natives_java_io_FileDescriptor from '../stdlib/java/io/FileDescriptor'
import natives_java_io_FileInputStream from '../stdlib/java/io/FileInputStream'
import natives_java_io_FileOutputStream from '../stdlib/java/io/FileOutputStream'
import natives_java_io_UnixFileSystem from '../stdlib/java/io/UnixFileSystem'
import natives_java_lang_Class from '../stdlib/java/lang/Class'
import natives_java_lang_ClassLoader from '../stdlib/java/lang/ClassLoader'
import natives_java_lang_Double from '../stdlib/java/lang/Double'
import natives_java_lang_Float from '../stdlib/java/lang/Float'
import natives_java_lang_Object from '../stdlib/java/lang/Object'
import natives_java_lang_Runtime from '../stdlib/java/lang/Runtime'
import natives_java_lang_String from '../stdlib/java/lang/String'
import natives_java_lang_System from '../stdlib/java/lang/System'
import natives_java_lang_Thread from '../stdlib/java/lang/Thread'
import natives_java_lang_Throwable from '../stdlib/java/lang/Throwable'
import natives_java_lang_invoke_MethodHandleNatives from '../stdlib/java/lang/invoke/MethodHandleNatives'
import natives_java_lang_reflect_Array from '../stdlib/java/lang/reflect/Array'
import natives_java_security_AccessController from '../stdlib/java/security/AccessController'
import natives_java_util_concurrent_atomic_AtomicLong from '../stdlib/java/util/concurrent/atomic/AtomicLong'
import natives_sun_misc_Perf from '../stdlib/sun/misc/Perf'
import natives_sun_misc_Signal from '../stdlib/sun/misc/Signal'
import natives_sun_misc_URLClassPath from '../stdlib/sun/misc/URLClassPath'
import natives_sun_misc_Unsafe from '../stdlib/sun/misc/Unsafe'
import natives_sun_misc_VM from '../stdlib/sun/misc/VM'
import natives_sun_reflect_NativeConstructorAccessorImpl from '../stdlib/sun/reflect/NativeConstructorAccessorImpl'
import natives_sun_reflect_NativeMethodAccessorImpl from '../stdlib/sun/reflect/NativeMethodAccessorImpl'
import natives_sun_reflect_Reflection from '../stdlib/sun/reflect/Reflection'

/**
 * Every native-method implementation under `jvm/stdlib`, aggregated into a
 * single `Lib` map and statically imported, so the Conductor evaluator
 * (bundled as a single browser IIFE, with no dynamic `require`/`readFile`)
 * has the same native methods available as the Node CLI path (`run.ts`,
 * which loads them lazily via `readFile`). Regenerate by hand (or re-list
 * `find src/jvm/stdlib -name "*.ts"`) if `jvm/stdlib/**` gains or loses a
 * class.
 */
const stdlibNatives: Lib = {
  'java/io/FileDescriptor': { methods: natives_java_io_FileDescriptor },
  'java/io/FileInputStream': { methods: natives_java_io_FileInputStream },
  'java/io/FileOutputStream': { methods: natives_java_io_FileOutputStream },
  'java/io/UnixFileSystem': { methods: natives_java_io_UnixFileSystem },
  'java/lang/Class': { methods: natives_java_lang_Class },
  'java/lang/ClassLoader': { methods: natives_java_lang_ClassLoader },
  'java/lang/Double': { methods: natives_java_lang_Double },
  'java/lang/Float': { methods: natives_java_lang_Float },
  'java/lang/Object': { methods: natives_java_lang_Object },
  'java/lang/Runtime': { methods: natives_java_lang_Runtime },
  'java/lang/String': { methods: natives_java_lang_String },
  'java/lang/System': { methods: natives_java_lang_System },
  'java/lang/Thread': { methods: natives_java_lang_Thread },
  'java/lang/Throwable': { methods: natives_java_lang_Throwable },
  'java/lang/invoke/MethodHandleNatives': { methods: natives_java_lang_invoke_MethodHandleNatives },
  'java/lang/reflect/Array': { methods: natives_java_lang_reflect_Array },
  'java/security/AccessController': { methods: natives_java_security_AccessController },
  'java/util/concurrent/atomic/AtomicLong': { methods: natives_java_util_concurrent_atomic_AtomicLong },
  'sun/misc/Perf': { methods: natives_sun_misc_Perf },
  'sun/misc/Signal': { methods: natives_sun_misc_Signal },
  'sun/misc/URLClassPath': { methods: natives_sun_misc_URLClassPath },
  'sun/misc/Unsafe': { methods: natives_sun_misc_Unsafe },
  'sun/misc/VM': { methods: natives_sun_misc_VM },
  'sun/reflect/NativeConstructorAccessorImpl': { methods: natives_sun_reflect_NativeConstructorAccessorImpl },
  'sun/reflect/NativeMethodAccessorImpl': { methods: natives_sun_reflect_NativeMethodAccessorImpl },
  'sun/reflect/Reflection': { methods: natives_sun_reflect_Reflection },
}

export default stdlibNatives

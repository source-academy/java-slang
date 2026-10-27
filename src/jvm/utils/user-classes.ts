import { BinaryWriter } from '../../compiler/binary-writer'
import { Class, ClassFile } from '../../ClassFile/types'
import parseBin from './disassembler'

/**
 * Turns the output of `compile()` / `compileFromSource()` into the map the JVM's
 * `readFileSync` callback expects: `{ "<ClassName>.class": ClassFile }`.
 *
 * Every class returned by the compiler must be registered, not just the first
 * one - a Java source file compiles to more than one class file whenever it
 * declares an enum or a nested class. Each `classFile` is also round-tripped
 * through the binary writer and re-parsed, because the compiler's in-memory
 * constant pool is indexed differently from what the JVM's class linker expects.
 *
 * Use with `userDir: ''` so the loader asks for `"<ClassName>.class"`:
 *
 *   const userFiles = userClassFiles(compileFromSource(src))
 *   setupJVM({
 *     javaClassPath: '', userDir: '',
 *     callbacks: {
 *       readFileSync: path => userFiles[path] ?? readStdlibClass(path),
 *       ...
 *     },
 *   })
 */
export function userClassFiles(classes: Class[]): { [fileName: string]: ClassFile } {
  const writer = new BinaryWriter()
  const files: { [fileName: string]: ClassFile } = {}
  for (const cls of classes) {
    const bytes = writer.generateBinary(cls.classFile)
    files[cls.className + '.class'] = parseBin(
      new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    )
  }
  return files
}

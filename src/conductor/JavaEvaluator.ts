import { EvaluatorRuntimeError } from '@sourceacademy/conductor/common'
import { BasicEvaluator, IRunnerPlugin } from '@sourceacademy/conductor/runner'
import { compileFromSource } from '../compiler'
import { ClassFile } from '../ClassFile/types'
import setupJVM, { parseBin, userClassFiles } from '../jvm/index'
import { a2ab } from '../jvm/utils/disassembler'
import stdlibClassfiles from '../jvm/utils/stdlib-classfiles'
import stdlibNatives from '../jvm/utils/stdlib-natives'

/**
 * Decodes a base64 string to bytes without relying on Node's `Buffer`, which
 * doesn't exist in the browser/Worker environment this evaluator is bundled
 * for. `atob` is available on both `window` and `WorkerGlobalScope`.
 */
function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function base64ToClassFile(b64: string): ClassFile {
  return parseBin(new DataView(a2ab(base64ToUint8Array(b64))))
}

/**
 * Java conductor evaluator. Delivers Conductor's normal run-code flow
 * (`evaluateChunk`, source text typed into the editor) by compiling the chunk
 * with the java-slang compiler and running the result on the in-repo JVM.
 * `evaluateFile` additionally accepts a single precompiled `.class` file,
 * base64-encoded, for callers that already have a classfile in hand.
 */
export class JavaEvaluator extends BasicEvaluator {
  constructor(conductor: IRunnerPlugin) {
    super(conductor)
  }

  async evaluateChunk(chunk: string): Promise<void> {
    let userFiles: { [fileName: string]: ClassFile }
    try {
      userFiles = userClassFiles(compileFromSource(chunk))
    } catch (e) {
      this.conductor.sendError(new EvaluatorRuntimeError(e instanceof Error ? e.message : String(e)))
      return
    }
    await this.runClasses(userFiles, 'Main')
  }

  async evaluateFile(fileName: string, fileContent: string): Promise<void> {
    try {
      if (!fileName.endsWith('.class')) {
        this.conductor.sendOutput('JavaEvaluator: unsupported file type')
        return
      }

      // Expect class file content as base64 to allow conductor transport via JSON
      const classFile = base64ToClassFile(fileContent)

      // resolve class internal name (e.g. "com/example/Main")
      let mainClassName = 'Main'
      try {
        const clsInfo = classFile.constantPool[classFile.thisClass]
        const nameConst = classFile.constantPool[(clsInfo as any).nameIndex]
        mainClassName = (nameConst as any).value
      } catch (e) {
        // ignore and use default
      }

      // the AbstractClassLoader builds paths like (classPath ? classPath + '/' + className : className) + '.class'
      // we'll use an empty userDir so loaders will request '<internalName>.class'
      await this.runClasses({ [`${mainClassName}.class`]: classFile }, mainClassName)
    } catch (err) {
      this.conductor.sendError(new EvaluatorRuntimeError(err instanceof Error ? err.message : String(err)))
    }
  }

  /**
   * Runs a set of already-parsed classes on the JVM, backed by the bundled JDK
   * stdlib for anything else requested. Resolves once the JVM actually
   * finishes (or errors) - the JVM's thread pool schedules work via
   * `setTimeout`, so `runFn()` itself only kicks execution off.
   */
  private runClasses(
    userFiles: { [fileName: string]: ClassFile },
    mainClassName: string
  ): Promise<void> {
    const parsedStdlibCache: { [fileName: string]: ClassFile } = {}

    const readFileSync = (path: string): ClassFile => {
      if (userFiles[path]) return userFiles[path]

      if (parsedStdlibCache[path]) return parsedStdlibCache[path]
      // path might be prefixed with 'stdlib/' when requesting runtime classes
      const key = path.startsWith('stdlib/') ? path.slice('stdlib/'.length) : path
      const b64 = stdlibClassfiles[key]
      if (!b64) {
        // final fallback: error -> loader will translate to ClassNotFoundException
        throw new Error(`readFileSync: class not found: ${path}`)
      }
      return (parsedStdlibCache[path] = base64ToClassFile(b64))
    }

    return new Promise(resolve => {
      const runFn = setupJVM({
        mainClass: mainClassName,
        userDir: '',
        // Natives are bundled statically (no dynamic `require`/`readFile` in a
        // browser Worker) - see stdlib-natives.ts.
        natives: stdlibNatives,
        callbacks: {
          readFileSync,
          readFile: () => Promise.reject('readFile not implemented'),
          stdout: (m: string) => this.conductor.sendOutput(m),
          stderr: (m: string) => this.conductor.sendOutput(`ERR: ${m}`),
          onFinish: () => {
            // when JVM finishes we don't currently capture any return value
            this.conductor.sendResult('')
            resolve()
          }
        }
      })

      try {
        runFn()
      } catch (e) {
        this.conductor.sendError(new EvaluatorRuntimeError(e instanceof Error ? e.message : String(e)))
        resolve()
      }
    })
  }
}

export default JavaEvaluator

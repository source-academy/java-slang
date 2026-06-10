import BasicEvaluator, { IRunnerPlugin } from './runner'
import setupJVM from '../jvm/index'

/**
 * Minimal Java conductor evaluator stub.
 * Currently this evaluator is a placeholder that demonstrates how to
 * integrate with the local JVM runner. It expects class file bytes
 * encoded as a base64 string when used via conductor channels.
 */
export class JavaEvaluator extends BasicEvaluator {
  constructor(conductor: IRunnerPlugin) {
    super(conductor)
  }

  async evaluateChunk(_chunk: string): Promise<void> {
    this.conductor.sendOutput('JavaEvaluator: evaluateChunk not supported; use evaluateFile with a .class file encoded as base64')
  }

  async evaluateFile(fileName: string, fileContent: string): Promise<void> {
    try {
      if (fileName.endsWith('.class')) {
        // Expect class file content as base64 to allow conductor transport via JSON
        Buffer.from(fileContent, 'base64')
        // NOTE: we intentionally do not parse the class bytes here in the stub
        // to avoid coupling the evaluator to the full classfile parser. A future
        // implementation may call `parseBin` and then load into the JVM.
        // create a JVM and run the Main class if present (not implemented in this stub)
        setupJVM({
          callbacks: {
            readFileSync: (path: string) => {
              throw new Error('readFileSync not available in conductor JavaEvaluator')
            },
            stdout: (m: string) => this.conductor.sendOutput(m),
            stderr: (m: string) => this.conductor.sendOutput(`ERR: ${m}`)
          }
        })
        // Register a readFileSync that returns our in-memory class when requested
        // The JVM runner currently expects classes on disk; for now we run using a minimal approach
        this.conductor.sendOutput('JavaEvaluator: running class via in-memory runner is not yet implemented')
        this.conductor.sendResult('')
        return
      }

      this.conductor.sendOutput('JavaEvaluator: unsupported file type')
    } catch (err) {
      this.conductor.sendError(`${err instanceof Error ? err.message : String(err)}`)
    }
  }
}

export default JavaEvaluator

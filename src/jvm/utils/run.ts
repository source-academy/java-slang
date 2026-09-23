import * as fs from 'node:fs'
import * as path from 'node:path'
import { compileFromSource } from '../../compiler'
import { ClassFile } from '../../ClassFile/types'
import setupJVM, { parseBin, userClassFiles } from '../index'

/**
 * Runs a Java source file through the java-slang compiler + JVM from Node.
 *
 *   node dist/jvm/utils/run.js path/to/Main.java
 *
 * Requires a class bundle at dist/jvm/utils/classfiles.js (build it first with
 * `node dist/jvm/utils/build.js <rt-or-classpath>` — see build.ts). The bundle
 * must be a single JDK's classes; a Java 8 rt/ tree is what the JVM targets.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bundle: { [relPath: string]: string } = require('./classfiles').default

const NATIVES_DIR = path.join(__dirname, '..', 'stdlib')

const b64ToDataView = (b64: string): DataView => {
  const buf = Buffer.from(b64, 'base64')
  return new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
}

export default function run(sourcePath: string): Promise<{ stdout: string; stderr: string }> {
  const source = fs.readFileSync(sourcePath, 'utf8')
  const userFiles = userClassFiles(compileFromSource(source))

  const parsedCache: { [name: string]: ClassFile } = {}
  const readFileSync = (p: string): ClassFile => {
    const name = p.replace(/\.class$/, '')
    if (userFiles[name + '.class']) return userFiles[name + '.class']
    if (parsedCache[name]) return parsedCache[name]
    const encoded = bundle[name + '.class']
    if (!encoded) throw new Error(`class not found in bundle: ${name}`)
    return (parsedCache[name] = parseBin(b64ToDataView(encoded)))
  }

  const readFile = (p: string): Promise<any> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return Promise.resolve(require(path.join(NATIVES_DIR, p + '.js')))
    } catch (e) {
      return Promise.reject(e)
    }
  }

  return new Promise((resolve, reject) => {
    const stdout: string[] = []
    const stderr: string[] = []
    const jvm = setupJVM({
      mainClass: 'Main',
      javaClassPath: '',
      nativesPath: '',
      callbacks: {
        readFileSync,
        readFile,
        stdout: m => stdout.push(String(m)),
        stderr: m => stderr.push(String(m)),
        onFinish: () => resolve({ stdout: stdout.join(''), stderr: stderr.join('') })
      }
    })
    try {
      jvm()
    } catch (e) {
      reject(e)
    }
  })
}

if (require.main === module) {
  const sourcePath = process.argv[2]
  if (!sourcePath) {
    console.error('usage: node dist/jvm/utils/run.js path/to/Main.java')
    process.exit(2)
  }
  run(sourcePath)
    .then(({ stdout, stderr }) => {
      if (stdout) process.stdout.write(stdout)
      if (stderr) process.stderr.write(stderr)
      process.exit(0)
    })
    .catch(e => {
      console.error(e)
      process.exit(1)
    })
}

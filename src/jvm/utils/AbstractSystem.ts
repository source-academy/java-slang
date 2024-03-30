import { ClassFile } from '../../ClassFile/types'

export default abstract class AbstractSystem {
  abstract readFileSync(path: string): ClassFile

  abstract readFile(path: string): Promise<any>

  abstract stdout(message: string): void

  abstract stderr(message: string): void
}

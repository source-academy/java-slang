import { ConstantClass } from './types/class/Constants'

export interface ExceptionTableEntry {
  startPc: number
  endPc: number
  handlerPc: number
  catchType: ConstantClass | null
}

export class ExceptionTable implements Iterable<ExceptionTableEntry> {
  private entries: ExceptionTableEntry[]

  constructor(entries?: ExceptionTableEntry[]) {
    this.entries = entries ? entries.slice() : []
  }

  retrieve(pc: number): ExceptionTableEntry | null {
    for (let i = 0; i < this.entries.length; i++) {
      const e = this.entries[i]
      if (pc >= e.startPc && pc < e.endPc) {
        return e
      }
    }
    return null
  }

  insert(startPc: number, endPc: number, handlerPc: number, catchType: ConstantClass | null): void {
    this.entries.push({ startPc, endPc, handlerPc, catchType })
  }

  toArray(): ExceptionTableEntry[] {
    return this.entries.slice()
  }

  [Symbol.iterator](): Iterator<ExceptionTableEntry> {
    return this.entries[Symbol.iterator]()
  }
  forEach(cb: (entry: ExceptionTableEntry, idx?: number) => void) {
    this.entries.forEach(cb)
  }

  get length() {
    return this.entries.length
  }
}

import { Class } from './classes'

export enum ThrowsClauseType {
  METHOD = 'method'
}

export class Throws {
  private exceptions: Class[] = []
  public constructor() {}

  public addException(exception: Class): void {
    // avoid duplicates
    if (this.exceptions.some(e => e === exception)) return
    this.exceptions.push(exception)
  }

  public getExceptions(): Class[] {
    return this.exceptions.slice()
  }

  public toString(): string {
    if (this.exceptions.length === 0) return ''
    return `throws ${this.exceptions.map(exception => exception.getClassName()).join(', ')}`
  }
}

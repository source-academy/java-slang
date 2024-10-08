import { Class } from './classes'

export enum ThrowsClauseType {
  METHOD = 'method'
}

export class Throws {
  private exceptions: Class[] = []
  public constructor() {}

  // public addThrowable(
  //   throwsClauseType: ThrowsClauseType,
  //   throwable: Class,
  //   location: Location,
  // ): void | TypeCheckerError {}

  public toString(): string {
    return `throws ${this.exceptions.map(exception => exception.getClassName()).join(', ')}`
  }
}

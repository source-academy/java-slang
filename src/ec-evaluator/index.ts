import { parse } from '../ast/parser'
import { typeCheck } from '../types'
import { Control, Environment, Stash } from './components'
import { STEP_LIMIT } from './constants'
import { RuntimeError } from './errors'
import { evaluate } from './interpreter'
import { LFSR, libraryClasses } from './lib'
import { Context, Error, Finished, Interfaces, IOCallbacks, Result } from './types'
import { handleSequence } from './utils'

export * from './components'
export * from './errors'
export * from './types'
export { isInstr, isNode } from './utils'

export const runECEvaluatorInjected = (
  code: string,
  targetStep: number = STEP_LIMIT,
  ioCallbacks: IOCallbacks
): Promise<Result> => {
  const context = createContext(code, ioCallbacks)

  // type checking
  const typeCheckResult = typeCheck(libraryClasses, code)
  if (typeCheckResult.hasTypeErrors) {
    const typeErrMsg = typeCheckResult.errorMsgs.join('\n')
    context.interfaces.stderr('TypeCheck', typeErrMsg)
    return Promise.resolve({ status: 'error' } as Error)
  }

  // load library
  const libraryCompilationUnit = parse(libraryClasses)
  context.control.push(
    ...handleSequence(libraryCompilationUnit.topLevelClassOrInterfaceDeclarations)
  )
  evaluate(context, targetStep)

  try {
    // parse() may throw SyntaxError.
    const compilationUnit = parse(code)

    context.control.push(compilationUnit)
    // evaluate() may throw RuntimeError
    const value = evaluate(context, targetStep)

    return new Promise((resolve, _) => {
      resolve({ status: 'finished', context, value } as Finished)
    })
  } catch (e) {
    // Possible interpreting language error thrown, so conversion to RuntimeError may be required.
    const error = e.type ? e : new RuntimeError(e.message)
    context.errors.push(error)
    return new Promise((resolve, _) => {
      resolve({ status: 'error', context } as Error)
    })
  }
}

export const runECEvaluator = (code: string, targetStep: number = STEP_LIMIT): Promise<Result> => {
  const context = createContext(code)
  try {
    // parse() may throw SyntaxError.
    const compilationUnit = parse(code)

    context.control.push(compilationUnit)
    // evaluate() may throw RuntimeError
    const value = evaluate(context, targetStep)

    return new Promise((resolve, _) => {
      resolve({ status: 'finished', context, value } as Finished)
    })
  } catch (e) {
    // Possible interpreting language error thrown, so conversion to RuntimeError may be required.
    const error = e.type ? e : new RuntimeError(e.message)
    context.errors.push(error)
    return new Promise((resolve, _) => {
      resolve({ status: 'error', context } as Error)
    })
  }
}

export const createContext = (code: string, ioCallbacks?: IOCallbacks): Context => ({
  errors: [],

  control: new Control(),
  stash: new Stash(),
  environment: new Environment(),

  interfaces: initialiseInterfaces(code, ioCallbacks),

  totalSteps: 0
})

const initialiseInterfaces = (code: string, ioCallbacks?: IOCallbacks): Interfaces => {
  return {
    stdout: ioCallbacks?.stdout ?? console.log,
    stderr: ioCallbacks?.stderr ?? console.log,
    statics: {
      lfsr: new LFSR(code)
    }
  }
}

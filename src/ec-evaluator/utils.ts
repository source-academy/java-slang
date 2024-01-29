import { uniqueId } from "lodash"
import { AgendaItem, Context, Environment, Frame, Instr, Value } from "./types"
import { Node } from "../ast/types/ast"
import { 
  BlockStatement, 
  Literal, 
  LocalVariableDeclarationStatement 
} from "../ast/types/blocks-and-statements"
import { CompilationUnit } from "../ast/types/packages-and-modules"

/**
 * Stack is implemented for agenda and stash registers.
 */
interface IStack<T> {
  push(...items: T[]): void
  pop(): T | undefined
  peek(): T | undefined
  size(): number
  isEmpty(): boolean
  getStack(): T[]
}

export class Stack<T> implements IStack<T> {
  // Bottom of the array is at index 0
  private storage: T[] = []
  private trace: T[] = []

  public constructor() {}

  public push(...items: T[]): void {
    for (const item of items) {
      this.storage.push(item);
      this.trace.push(item);
    }
  }

  public pop(): T | undefined {
    return this.storage.pop()
  }

  public peek(): T | undefined {
    if (this.isEmpty()) {
      return undefined
    }
    return this.storage[this.size() - 1]
  }

  public size(): number {
    return this.storage.length
  }

  public isEmpty(): boolean {
    return this.size() == 0
  }

  public getStack(): T[] {
    // return a copy of the stack's contents
    return [...this.storage]
  }

  public getTrace(): T[] {
    return [...this.trace];
  }
}

/**
 * Typeguard for Instr to distinguish between program statements and instructions.
 *
 * @param command An AgendaItem
 * @returns true if the AgendaItem is an instruction and false otherwise.
 */
export const isInstr = (command: AgendaItem): command is Instr => {
  return (command as Instr).instrType !== undefined
}

/**
 * Typeguard for esNode to distinguish between program statements and instructions.
 *
 * @param command An AgendaItem
 * @returns true if the AgendaItem is an esNode and false if it is an instruction.
 */
export const isNode = (command: AgendaItem): command is Node => {
  return (command as Node).kind !== undefined
}

/**
 * A helper function for handling sequences of statements.
 * Statements must be pushed in reverse order, and each statement is separated by a pop
 * instruction so that only the result of the last statement remains on stash.
 * Value producing statements have an extra pop instruction.
 *
 * @param seq Array of statements.
 * @returns Array of commands to be pushed into agenda.
 */
export const handleSequence = (seq: BlockStatement[]): AgendaItem[] => {
  const result: AgendaItem[] = []
  for (const command of seq) {
    result.push(command)
  }
  // Push statements in reverse order
  return result.reverse()
}

/**
 * Environments
 */

export const currentEnvironment = (context: Context) => context.runtime.environments[0]

export const createBlockEnvironment = (
  context: Context,
  name = 'blockEnvironment',
  head: Frame = {}
): Environment => {
  return {
    name,
    tail: currentEnvironment(context),
    head,
    id: uniqueId()
  }
}

export const pushEnvironment = (context: Context, environment: Environment) => {
  context.runtime.environments.unshift(environment)
  context.runtime.environmentTree.insert(environment)
}

/**
 * Variables
 */

const DECLARED_BUT_NOT_YET_ASSIGNED = Symbol('Used to implement block scope')

export function declareVariables(
  context: Context,
  node: CompilationUnit,
  environment: Environment
) {
  for (const statement of node.topLevelClassOrInterfaceDeclarations[0].classBody[0].methodBody) {
    if (statement.kind === 'LocalVariableDeclarationStatement') {
      if (environment.head.hasOwnProperty(statement.variableDeclarationList.variableDeclaratorId)) {
        throw new Error("Variable re-declared.");
      }
      environment.head[statement.variableDeclarationList.variableDeclaratorId] = DECLARED_BUT_NOT_YET_ASSIGNED
    }
  }
  return environment
}

export function defineVariable(
  context: Context,
  name: string,
  value: Value,
  constant = false,
  node: LocalVariableDeclarationStatement
) {
  const environment = currentEnvironment(context)

  if (environment.head[name] !== DECLARED_BUT_NOT_YET_ASSIGNED) {
    throw new Error("Variable not declared.")
  }

  Object.defineProperty(environment.head, name, {
    value,
    writable: !constant,
    enumerable: true
  })

  return environment
}

/**
 * Binary Expressions
 */
export const evaluateBinaryExpression = (operator: string, left: Literal, right: Literal) => {
  switch (operator) {
    case "+":
      return {
        kind: "Literal",
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) + Number(right.literalType.value)),
        },
      };
    case "-":
      return {
        kind: "Literal",
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) - Number(right.literalType.value)),
        },
      };
    case "*":
      return {
        kind: "Literal",
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) * Number(right.literalType.value)),
        },
      };
    case "/":
      return {
        kind: "Literal",
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) / Number(right.literalType.value)),
        },
      };
    case "%":
      return {
        kind: "Literal",
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) % Number(right.literalType.value)),
        },
      };
    default:
      return undefined;
  }
}

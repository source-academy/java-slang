import { 
  BinaryExpression, 
  Literal, 
  LocalVariableDeclarationStatement, 
  VariableDeclarator
} from "../ast/types/blocks-and-statements";
import { CompilationUnit } from "../ast/types/packages-and-modules";
import { 
  Stack, 
  createBlockEnvironment, 
  declareVariables, 
  defineVariable, 
  evaluateBinaryExpression, 
  handleSequence, 
  isNode, 
  pushEnvironment 
} from "./utils";
import { AgendaItem, AssmtInstr, BinOpInstr, Context, Instr, InstrType, Value } from "./types";
import { Identifier } from "../ast/types/classes";
import * as instr from './instrCreator'
import { createContext } from "./createContext";

type CmdEvaluator = (
  command: AgendaItem,
  context: Context,
  agenda: Agenda,
  stash: Stash,
) => void

/**
 * The agenda is a list of commands that still needs to be executed by the machine.
 * It contains syntax tree nodes or instructions.
 */
export class Agenda extends Stack<AgendaItem> {
  public constructor(compilationUnit: CompilationUnit) {
    super();

    // Load compilationUnit into agenda stack
    this.push(compilationUnit);
  }
}

/**
 * The stash is a list of values that stores intermediate results.
 */
export class Stash extends Stack<Value> {
  public constructor() {
    super()
  }
}

/**
 * The primary runner/loop of the explicit control evaluator.
 *
 * @param context The context to evaluate the program in.
 * @param agenda Points to the current context.runtime.agenda
 * @param stash Points to the current context.runtime.stash
 * @returns A special break object if the program is interrupted by a breakpoint;
 * else the top value of the stash. It is usually the return value of the program.
 */
export const evaluate = (compilationUnit: CompilationUnit): [any, AgendaItem[], any[]] => {
  const context = createContext();
  const agenda = new Agenda(compilationUnit);
  const stash = new Stash();

  let command = agenda.peek()
  
  // console.log("Agenda: ", agenda);
  // console.log("Stash: ", stash);
  // console.log("Environment: ", context.runtime.environments)
  
  while (command) {
    agenda.pop()
    if (isNode(command)) {
      cmdEvaluators[command.kind](command, context, agenda, stash)
    } else {
      // Command is an instrucion
      cmdEvaluators[command.instrType](command, context, agenda, stash)
    }

    // console.log("----------------------------------------------------------------------------")
    // console.log("Agenda: ", agenda);
    // console.log("Stash: ", stash);
    // console.log("Environment: ", context.runtime.environments)

    command = agenda.peek()
  }

  return [stash.peek(), agenda.getTrace(), stash.getTrace()]
}

/**
 * Dictionary of functions which handle the logic for the response of the three registers of
 * the ASE machine to each AgendaItem.
 */
const cmdEvaluators: { [type: string]: CmdEvaluator } = {
  /**
   * Statements
   */

  CompilationUnit: (command: CompilationUnit, context:Context, agenda: Agenda, stash: Stash) => {
    // Create and push the environment only if it is non empty.
    const environment = createBlockEnvironment(context, 'mainFuncEnvironment')
    pushEnvironment(context, environment)
    declareVariables(context, command, environment)

    if (command.topLevelClassOrInterfaceDeclarations[0].classBody[0].methodBody.length == 1) {
      // If program only consists of one statement, evaluate it immediately
      const next = command.topLevelClassOrInterfaceDeclarations[0].classBody[0].methodBody[0]
      cmdEvaluators[next.kind](next, context, agenda, stash)
      
      // console.log("----------------------------------------------------------------------------")
      // console.log("Agenda: ", agenda);
      // console.log("Stash: ", stash);
      // console.log("Environment: ", context.runtime.environments)

    } else {
      // Push block body
      agenda.push(...handleSequence(command.topLevelClassOrInterfaceDeclarations[0].classBody[0].methodBody))
    }
  },

  LocalVariableDeclarationStatement: function (
    command: LocalVariableDeclarationStatement,
    context:Context,
    agenda: Agenda,
    stash: Stash,
  ) {
    const declaration: VariableDeclarator = command.variableDeclarationList
    const id = declaration.variableDeclaratorId as Identifier
    const init = declaration.variableInitializer

    agenda.push(instr.popInstr(command))
    agenda.push(instr.assmtInstr(id, false, true, command))
    agenda.push(init)
  },

  Literal: (command: Literal, context:Context, agenda: Agenda, stash: Stash) => {
    stash.push(command);
  },

  BinaryExpression: function (command: BinaryExpression, context: Context, agenda: Agenda, stash: Stash) {
    agenda.push(instr.binOpInstr(command.operator, command))
    agenda.push(command.right)
    agenda.push(command.left)
  },

  /**
   * Instructions
   */
  [InstrType.POP]: function (command: Instr, context: Context, agenda: Agenda, stash: Stash) {
    stash.pop()
  },
  
  [InstrType.ASSIGNMENT]: function (
    command: AssmtInstr,
    context: Context,
    agenda: Agenda,
    stash: Stash
  ) {
    defineVariable(context, command.symbol, stash.peek(), command.constant, 
      command.srcNode as LocalVariableDeclarationStatement)
  },

  [InstrType.BINARY_OP]: function (
    command: BinOpInstr,
    context: Context,
    agenda: Agenda,
    stash: Stash
  ) {
    const right = stash.pop()
    const left = stash.pop()
    stash.push(evaluateBinaryExpression(command.symbol, left, right))
  }
}

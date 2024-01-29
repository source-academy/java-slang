import { 
  Assignment,
  BinaryExpression,
  Expression,
  ExpressionName,
  Literal,
  LocalVariableDeclarationStatement,
  LocalVariableType,
  VariableDeclarator,
} from "../ast/types/blocks-and-statements";
import { Identifier } from "../ast/types/classes";
import { CompilationUnit } from "../ast/types/packages-and-modules";
import * as instr from './instrCreator';
import * as node from './nodeCreator';
import {
  ControlItem,
  AssmtInstr,
  BinOpInstr,
  Context,
  Instr,
  InstrType,
  Value,
  Name,
} from "./types";
import { 
  Stack,
  declareVariable,
  evaluateBinaryExpression,
  getVariable,
  handleSequence,
  isNode,
  setVariable,
} from "./utils";

type CmdEvaluator = (
  command: ControlItem,
  context: Context,
  control: Control,
  stash: Stash,
) => void

/**
 * Components of CSE Machine.
 */
export class Control extends Stack<ControlItem> {};
export class Stash extends Stack<Value> {};
export class Environment extends Map<Name, Value> {};

export const evaluate = (context: Context, targetStep: number = Infinity): Value => {
  const control = context.control;
  const stash = context.stash;

  let step = 1;

  let command = control.peek();
  
  while (command) {
    if (step === targetStep) {
      return stash.peek();
    }

    control.pop();
    if (isNode(command)) {
      cmdEvaluators[command.kind](command, context, control, stash);
    } else {
      cmdEvaluators[command.instrType](command, context, control, stash);
    }

    command = control.peek();
    step += 1;
  }

  context.totalSteps = step;
  return stash.peek();
}

const cmdEvaluators: { [type: string]: CmdEvaluator } = {
  CompilationUnit: (
    command: CompilationUnit,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    if (command.topLevelClassOrInterfaceDeclarations[0].classBody[0].methodBody.blockStatements.length == 1) {
      // If program only consists of one statement, evaluate it immediately
      const next = command.topLevelClassOrInterfaceDeclarations[0].classBody[0].methodBody.blockStatements[0];
      cmdEvaluators[next.kind](next, context, control, stash)
    } else {
      // Push block body
      control.push(...handleSequence(command.topLevelClassOrInterfaceDeclarations[0].classBody[0].methodBody.blockStatements));
    }
  },

  LocalVariableDeclarationStatement: (
    command: LocalVariableDeclarationStatement,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    const type: LocalVariableType = command.localVariableType;
    const declaration: VariableDeclarator = command.variableDeclaratorList[0];
    const id: Identifier = declaration.variableDeclaratorId;

    // Break down LocalVariableDeclarationStatement with VariableInitializer into
    // LocalVariableDeclarationStatement without VariableInitializer and Assignment.
    const init: Expression | undefined = declaration?.variableInitializer;
    if (init) {
      control.push(node.assmtNode(id, init));
      control.push(node.localVarDeclNoInitNode(type, id));
      return;
    }

    // Evaluating LocalVariableDeclarationStatement just declares the variable.
    declareVariable(context, id);
  },

  Assignment: (
    command: Assignment,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // Assignment is an ExpressionStatement
    control.push(instr.popInstr(command));
    control.push(instr.assmtInstr(command.left.name, command));
    // TODO: EVAL_VAR LeftHandSide
    control.push(command.right);
  },

  Literal: (
    command: Literal,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    stash.push(command);
  },

  ExpressionName: (
    command: ExpressionName,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    stash.push(getVariable(context, command.name));
  },

  BinaryExpression: (
    command: BinaryExpression,
    context: Context,
    control: Control,
    stash: Stash
  ) => {
    control.push(instr.binOpInstr(command.operator, command));
    control.push(command.right);
    control.push(command.left);
  },

  [InstrType.POP]: (
    command: Instr,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    stash.pop();
  },
  
  [InstrType.ASSIGNMENT]: (
    command: AssmtInstr,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // TODO: LeftHandSide to be popped after implementing EVAL_VAR LeftHandSide
    setVariable(context, command.symbol, stash.peek());
  },

  [InstrType.BINARY_OP]: (
    command: BinOpInstr,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    const right = stash.pop();
    const left = stash.pop();
    stash.push(evaluateBinaryExpression(command.symbol, left, right));
  }
};

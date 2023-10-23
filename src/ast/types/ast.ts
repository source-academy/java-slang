import { CompilationUnit } from "./packages-and-modules";
import {
  Block,
  BlockStatement,
  Expression,
  ExpressionName,
  Literal,
  LocalVariableDeclarationStatement,
} from "./blocks-and-statements";

interface NodeMap {
  CompilationUnit: CompilationUnit;
  LocalVariableDeclarationStatement: LocalVariableDeclarationStatement;
  Block: Block;
  BlockStatement: BlockStatement;
  Expression: Expression;
  ExpresssionName: ExpressionName;
  Literal: Literal;
}

export type Node = NodeMap[keyof NodeMap];

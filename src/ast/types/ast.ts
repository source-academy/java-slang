import { CompilationUnit } from "./packages-and-modules";
import {
  Assignment,
  Block,
  BlockStatement,
  Expression,
} from "./blocks-and-statements";

interface NodeMap {
  CompilationUnit: CompilationUnit;
  Block: Block;
  BlockStatement: BlockStatement;
  Expression: Expression;
  Assignment: Assignment;
}

export type Node = NodeMap[keyof NodeMap];

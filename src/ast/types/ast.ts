import { CompilationUnit } from "./packages-and-modules";
import {
  Block,
  BlockStatement,
  Expression,
} from "./blocks-and-statements";

interface NodeMap {
  CompilationUnit: CompilationUnit;
  Block: Block;
  BlockStatement: BlockStatement;
  Expression: Expression;
}

export type Node = NodeMap[keyof NodeMap];

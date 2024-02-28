import { CompilationUnit } from "./packages-and-modules";
import {
  Assignment,
  Block,
  BlockStatement,
  ClassInstanceCreationExpression,
  ClassName,
  Expression,
  ExpressionStatement,
  MethodInvocation,
  MethodName,
  ReturnStatement,
} from "./blocks-and-statements";
import {
  FieldDeclaration,
  MethodDeclaration,
  NormalClassDeclaration,
} from "./classes";

interface NodeMap {
  CompilationUnit: CompilationUnit;
  MethodDeclaration: MethodDeclaration;
  FieldDeclaration: FieldDeclaration;
  Block: Block;
  BlockStatement: BlockStatement;
  Expression: Expression;
  Assignment: Assignment;
  ExpressionStatement: ExpressionStatement;
  MethodInvocation: MethodInvocation;
  ReturnStatement: ReturnStatement;
  MethodName: MethodName;
  NormalClassDeclaration: NormalClassDeclaration;
  ClassName: ClassName;
  ClassInstanceCreationExpression: ClassInstanceCreationExpression;
}

export type Node = NodeMap[keyof NodeMap];

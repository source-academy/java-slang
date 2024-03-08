import { CompilationUnit } from "./packages-and-modules";
import {
  Assignment,
  Block,
  BlockStatement,
  ClassInstanceCreationExpression,
  Expression,
  ExpressionStatement,
  MethodInvocation,
  ReturnStatement,
} from "./blocks-and-statements";
import {
  ConstructorDeclaration,
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
  NormalClassDeclaration: NormalClassDeclaration;
  ClassInstanceCreationExpression: ClassInstanceCreationExpression;
  ConstructorDeclaration: ConstructorDeclaration;
}

export type Node = NodeMap[keyof NodeMap];

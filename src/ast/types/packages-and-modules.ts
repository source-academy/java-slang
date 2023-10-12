import { BaseNode } from "./ast";
import { ClassDeclaration } from "./classes";
import { NodeType } from "./node-types";

export type AST = CompilationUnit;
export type CompilationUnit = OrdinaryCompilationUnit;
export interface OrdinaryCompilationUnit extends BaseNode {
  kind: NodeType.CompilationUnit;
  topLevelClassOrInterfaceDeclarations: Array<ClassDeclaration>;
}

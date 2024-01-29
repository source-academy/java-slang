import { ClassDeclaration, Identifier } from "./classes";

export type AST = CompilationUnit;
export type CompilationUnit = OrdinaryCompilationUnit;
export interface OrdinaryCompilationUnit {
  kind: "CompilationUnit";
  importDeclarations: Array<ImportDeclaration>;
  topLevelClassOrInterfaceDeclarations: Array<ClassDeclaration>;
}

export interface ImportDeclaration {
  isStatic: boolean;
  identifier: Identifier;
}
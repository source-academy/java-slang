import { ClassDeclaration } from "./classes";

export type AST = CompilationUnit;
export type CompilationUnit = OrdinaryCompilationUnit;
export interface OrdinaryCompilationUnit {
  kind: "CompilationUnit";
  topLevelClassOrInterfaceDeclarations: Array<ClassDeclaration>;
}

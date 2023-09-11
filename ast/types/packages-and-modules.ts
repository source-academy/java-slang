import { ClassDeclaration } from "./classes";

export type AST = CompilationUnit;
export type CompilationUnit = OrdinaryCompilationUnit;
export type OrdinaryCompilationUnit = Array<ClassDeclaration>;

import { BaseNode } from "../../ec-evaluator/types";
import { ClassDeclaration } from "./classes";

export type AST = CompilationUnit;
export type CompilationUnit = OrdinaryCompilationUnit;
export interface OrdinaryCompilationUnit extends BaseNode {
    topLevelClassOrInterfaceDeclarations: Array<ClassDeclaration>;
}

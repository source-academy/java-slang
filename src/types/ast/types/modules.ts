import { ClassDeclaration, Identifier } from './classes'
import { BaseNode } from '.'

interface NodeMap {
  CompilationUnit: CompilationUnit
}

export type ModuleNode = NodeMap[keyof NodeMap]

export type CompilationUnit = OrdinaryCompilationUnit

export interface OrdinaryCompilationUnit extends BaseNode {
  kind: 'CompilationUnit'
  importDeclarations: Array<ImportDeclaration>
  topLevelClassOrInterfaceDeclarations: Array<ClassDeclaration>
}

export interface ImportDeclaration {
  isStatic: boolean
  identifier: Identifier
}

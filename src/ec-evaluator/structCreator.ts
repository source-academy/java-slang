import {
  ConstructorDeclaration,
  FieldDeclaration,
  MethodDeclaration,
  NormalClassDeclaration,
  UnannType
} from '../ast/types/classes'
import { EnvNode } from './components'
import { Name, StructType, Type, VarValue, Variable, Symbol, Object, Class, Closure } from './types'

export const varStruct = (type: UnannType, name: Name, value: VarValue): Variable => ({
  kind: StructType.VARIABLE,
  type,
  name,
  value
})

export const symStruct = (value: string): Symbol => ({
  kind: StructType.SYMBOL,
  value
})

export const objStruct = (frame: EnvNode, c: Class): Object => ({
  kind: StructType.OBJECT,
  frame,
  class: c
})

export const closureStruct = (
  mtdOrCon: MethodDeclaration | ConstructorDeclaration,
  env: EnvNode
): Closure => ({
  kind: StructType.CLOSURE,
  mtdOrCon,
  env
})

export const classStruct = (
  frame: EnvNode,
  classDecl: NormalClassDeclaration,
  constructors: ConstructorDeclaration[],
  instanceFields: FieldDeclaration[],
  instanceMethods: MethodDeclaration[],
  staticFields: FieldDeclaration[],
  staticMethods: MethodDeclaration[],
  superclass?: Class
): Class => ({
  kind: StructType.CLASS,
  frame,
  classDecl,
  constructors,
  instanceFields,
  instanceMethods,
  staticFields,
  staticMethods,
  superclass
})

export const typeStruct = (type: string): Type => ({
  kind: StructType.TYPE,
  type
})

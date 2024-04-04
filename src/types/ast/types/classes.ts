import { Block, VariableDeclarator } from './blocks-and-statements'
import { BaseNode } from '.'

export type ClassNode = ClassDeclaration

export type ClassDeclaration = NormalClassDeclaration

export interface NormalClassDeclaration extends BaseNode {
  kind: 'NormalClassDeclaration'
  classModifier: Array<ClassModifier>
  typeIdentifier: Identifier
  sclass?: Identifier
  classBody: Array<ClassBodyDeclaration>
}

export type ClassModifier =
  | 'public'
  | 'protected'
  | 'private'
  | 'abstract'
  | 'static'
  | 'final'
  | 'sealed'
  | 'non-sealed'
  | 'strictfp'

export type ClassBodyDeclaration = ClassMemberDeclaration | ConstructorDeclaration
export type ClassMemberDeclaration = MethodDeclaration | FieldDeclaration

export interface ConstructorDeclaration extends BaseNode {
  kind: 'ConstructorDeclaration'
  constructorModifier: Array<ConstructorModifier>
  constructorDeclarator: ConstructorDeclarator
  constructorBody: ConstructorBody
}

export type ConstructorModifier = 'public' | 'protected' | 'private'

export interface ConstructorDeclarator {
  identifier: Identifier
  formalParameterList: Array<FormalParameter>
}

export type ConstructorBody = Block

export interface MethodDeclaration extends BaseNode {
  kind: 'MethodDeclaration'
  methodModifier: Array<MethodModifier>
  methodHeader: MethodHeader
  methodBody: MethodBody
}

export type MethodModifier =
  | 'public'
  | 'protected'
  | 'private'
  | 'abstract'
  | 'static'
  | 'final'
  | 'synchronized'
  | 'native'
  | 'strictfp'

export interface MethodHeader {
  result: Result
  identifier: Identifier
  formalParameterList: Array<FormalParameter>
}

export type Result = 'void' | UnannType

export interface FormalParameter {
  kind: 'FormalParameter'
  unannType: UnannType
  identifier: Identifier
}

export interface FieldDeclaration extends BaseNode {
  kind: 'FieldDeclaration'
  fieldModifier: Array<FieldModifier>
  fieldType: UnannType
  variableDeclaratorList: Array<VariableDeclarator>
}

export type FieldModifier =
  | 'public'
  | 'protected'
  | 'private'
  | 'static'
  | 'final'
  | 'transient'
  | 'volatile'

export type UnannType = string
export type VariableDeclaratorId = Identifier

export type MethodBody = Block
export type Identifier = string

export type AST = CompilationUnit;
export type CompilationUnit = OrdinaryCompilationUnit;
export type OrdinaryCompilationUnit = Array<ClassDeclaration>;
export type ClassDeclaration = NormalClassDeclaration;
export interface NormalClassDeclaration {
  classModifier: Array<ClassModifier>;
  typeIdentifier: Identifier;
  classBody: Array<ClassBodyDeclaration>;
}
export type ClassBodyDeclaration = ClassMemberDeclaration;
export type ClassMemberDeclaration = MethodDeclaration;

export interface MethodDeclaration {
  methodModifier: Array<MethodModifier>;
  methodHeader: MethodHeader;
  methodBody: MethodBody;
}
export interface MethodHeader {
  result: Result;
  methodDeclarator: MethodDeclarator;
}
export interface MethodDeclarator {
  identifier: Identifier;
  formalParameterList: FormalParameterList;
}
export type FormalParameterList = Array<FormalParameter>;
export interface FormalParameter {
  unannType: UnannReferenceType;
  variableDeclaratorId: Identifier;
}
export type ClassModifier =
  | "public"
  | "protected"
  | "private"
  | "abstract"
  | "static"
  | "final"
  | "sealed"
  | "non-sealed"
  | "strictfp";
export type MethodModifier =
  | "public"
  | "protected"
  | "private"
  | "abstract"
  | "static"
  | "final"
  | "synchronized"
  | "native"
  | "strictfp";
export type MethodBody = Array<string>;
export type Result = "void";
export type UnannReferenceType = string;
export type Identifier = string;
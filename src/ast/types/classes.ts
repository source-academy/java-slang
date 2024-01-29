import { Block } from "./blocks-and-statements";

export type ClassDeclaration = NormalClassDeclaration;

export interface NormalClassDeclaration {
  classModifier: Array<ClassModifier>;
  typeIdentifier: Identifier;
  classBody: Array<ClassBodyDeclaration>;
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

export type ClassBodyDeclaration = ClassMemberDeclaration;
export type ClassMemberDeclaration = MethodDeclaration;

export interface MethodDeclaration {
  methodModifier: Array<MethodModifier>;
  methodHeader: MethodHeader;
  methodBody: MethodBody;
}

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

export interface MethodHeader {
  result: Result;
  identifier: Identifier;
  formalParameterList: Array<FormalParameter>;
}

export type Result = UnannType;

export interface FormalParameter {
  kind: "FormalParameter";
  unannType: UnannType;
  identifier: Identifier;
}

export type UnannType = string;
export type VariableDeclaratorId = Identifier;

export type MethodBody = Block;
export type Identifier = string;

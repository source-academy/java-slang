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
    methodDeclarator: MethodDeclarator;
}

export type Result = "void";
export interface MethodDeclarator {
    identifier: Identifier;
    formalParameterList: Array<FormalParameter>;
}

export interface FormalParameter {
    unannType: UnannType;
    variableDeclaratorId: Identifier;
}

export type UnannType = string;
export type VariableDeclaratorId = Identifier;

export type MethodBody = Array<string>;
export type Identifier = string;
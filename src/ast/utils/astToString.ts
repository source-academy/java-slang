import { Node } from '../types/ast';
import {
  Assignment,
  BinaryExpression,
  Block,
  ClassInstanceCreationExpression,
  ExplicitConstructorInvocation,
  ExpressionName,
  ExpressionStatement,
  Literal,
  LocalVariableDeclarationStatement,
  MethodInvocation, PostfixExpression,PrefixExpression,
  ReturnStatement,
} from '../types/blocks-and-statements';
import {
  ConstructorDeclaration,
  FieldDeclaration,
  MethodDeclaration,
  NormalClassDeclaration,
} from '../types/classes';

const newline = (line: string): string => {
  return `${line}\n`;
}

const indentLine = (lvl: number, line: string): string => {
  return `${' '.repeat(lvl)}${line}`;
}

const INDENT_SPACES = 2;

export const astToString = (node: Node, indent: number = 0): string => {
  switch (node.kind) {
    case "NormalClassDeclaration":
      const c = node as NormalClassDeclaration;
      const cModifier = c.classModifier.length > 0 ? c.classModifier.join(" ") + " " : "";
      const cSuperclass = c.sclass ? " extends " + c.sclass : "";
      return newline(indentLine(indent, `${cModifier}class ${c.typeIdentifier}${cSuperclass} {`))
        + `${c.classBody.map(b => newline(astToString(b, indent + INDENT_SPACES))).join("")}`
        + `${indentLine(indent, "}")}`;

    case "Block":
      const block = node as Block;
      return `${newline(indentLine(indent, "{"))}`
        + `${block.blockStatements.map(s => newline(astToString(s, indent + INDENT_SPACES))).join("")}`
        + `${indentLine(indent, "}")}`;

    case "ConstructorDeclaration":
      const con = node as ConstructorDeclaration;
      const conModifier = con.constructorModifier.length > 0
        ? con.constructorModifier.join(" ") + " "
        : "";
      const conIdentifier = con.constructorDeclarator.identifier;
      const conParams = con.constructorDeclarator.formalParameterList.map(p => `${p.unannType} ${p.identifier}`).join(", ");
      return newline(indentLine(indent, `${conModifier}${conIdentifier}(${conParams}) {`))
        + `${con.constructorBody.blockStatements.map(s => newline(astToString(s, indent + INDENT_SPACES))).join("")}`
        + `${indentLine(indent, "}")}`;

    case "MethodDeclaration":
      const mtd = node as MethodDeclaration;
      const mtdModifier = mtd.methodModifier.length > 0 ? mtd.methodModifier.join(" ") + " " : "";
      const mtdRes = mtd.methodHeader.result;
      const mtdIdentifier = mtd.methodHeader.identifier;
      const mtdParams = mtd.methodHeader.formalParameterList.map(p => `${p.unannType} ${p.identifier}`).join(", ");
      return newline(indentLine(indent, `${mtdModifier}${mtdRes} ${mtdIdentifier}(${mtdParams}) {`))
        + `${mtd.methodBody.blockStatements.map(s => newline(astToString(s, indent + INDENT_SPACES))).join("")}`
        + `${indentLine(indent, "}")}`;

    case "FieldDeclaration":
      const field = node as FieldDeclaration;
      const fieldModifier = field.fieldModifier.length > 0 ? field.fieldModifier.join(" ") + " " : "";
      const fieldType = field.fieldType;
      const fieldIdentifier = field.variableDeclaratorList[0].variableDeclaratorId;
      const fieldInit = field.variableDeclaratorList[0].variableInitializer
        ? ` = ${astToString(field.variableDeclaratorList[0].variableInitializer! as ExpressionName)}`
        : "";
      return indentLine(indent, `${fieldModifier}${fieldType} ${fieldIdentifier}${fieldInit};`);

    case "LocalVariableDeclarationStatement":
      const localVar = node as LocalVariableDeclarationStatement;
      const localVarType = localVar.localVariableType;
      const localVarIdentifier = localVar.variableDeclaratorList[0].variableDeclaratorId;
      const localVarInit = localVar.variableDeclaratorList[0].variableInitializer
        ? ` = ${astToString(localVar.variableDeclaratorList[0].variableInitializer! as ExpressionName)}`
        : "";
      return indentLine(indent, `${localVarType} ${localVarIdentifier}${localVarInit};`);

    case "ReturnStatement":
      const returnStmt = node as ReturnStatement;
      const returnExp = returnStmt.exp.kind === "Void" ? "" : ` ${astToString(returnStmt.exp)}`;
      return indentLine(indent, `return${returnExp};`);

    case "ExpressionStatement":
      const expStmt = node as ExpressionStatement;
      return indentLine(indent, `${astToString(expStmt.stmtExp)};`);

    case "Assignment":
      const assmt = node as Assignment;
      return `${(assmt.left as ExpressionName).name} = ${astToString(assmt.right)}`;

    case "MethodInvocation":
      const mtdInv = node as MethodInvocation;
      return `${mtdInv.identifier}(${mtdInv.argumentList.map(a => astToString(a)).join(", ")})`

    case "ClassInstanceCreationExpression":
      const classInstanceCreationExp = node as ClassInstanceCreationExpression;
      return `new ${classInstanceCreationExp.identifier}(${classInstanceCreationExp.argumentList.map(a => astToString(a))})`;

    case "ExplicitConstructorInvocation":
      const expConInv = node as ExplicitConstructorInvocation;
      return indentLine(indent, `${expConInv.thisOrSuper}(${expConInv.argumentList.map(a => astToString(a))});`);

    case "BinaryExpression":
      const bin = node as BinaryExpression;
      return `${astToString(bin.left)} ${bin.operator} ${astToString(bin.right)}`;

    case "ExpressionName":
      const exp = node as ExpressionName;
      return exp.name;

    case "Literal":
      const literal = node as Literal;
      return `${literal.literalType.value}`;

    case "Void":
      return "void";

    case "PostfixExpression":
      const postfix = node as PostfixExpression;
      return `${astToString(postfix.expression)}${postfix.operator}`;
    case "PrefixExpression":
      const prefix = node as PrefixExpression;
      return `${prefix.operator}${astToString(prefix.expression)}`;

    default:
      return node.kind;
  }
}
import {
  CstNode,
  DimsCtx,
  FormalParameterCtx,
  MethodDeclaratorCtx,
  MethodModifierCtx,
  ResultCtx,
  UnannClassTypeCtx,
  VariableDeclaratorIdCtx,
} from "java-parser";

import { BaseJavaCstVisitorWithDefaults } from "java-parser";
import { Modifiers, MethodNode, Param } from "../ast/types";

export class MethodExtractor extends BaseJavaCstVisitorWithDefaults {
  private stack: Array<string> = [];
  private modifiers: Modifiers = [];
  private returnType: string = '';
  private name: string = '';
  private params: Array<Param> = [];
  private body: Array<string> = [];

  constructor() {
    super();
    this.stack = [];
    this.modifiers = [];
    this.returnType = '';
    this.name = '';
    this.params = [];
    this.body = [];
    this.validateVisitor();
  }

  private getAndPop() {
    const res = this.stack.at(-1);
    this.stack.pop();
    return res as string;
  }

  extract(cst: CstNode): MethodNode {
    this.stack = [];
    this.modifiers = [];
    this.returnType = '';
    this.name = '';
    this.params = [];
    this.body = [];
    this.visit(cst);
    return {
      type: 'method',
      modifiers: this.modifiers,
      returnType: this.returnType,
      name: this.name,
      params: this.params,
      body: this.body
    };
  }

  methodModifier(ctx: MethodModifierCtx) {
    const possibleModifiers = [
      ctx.Public,
      ctx.Protected,
      ctx.Private,
      ctx.Abstract,
      ctx.Static,
      ctx.Final,
      ctx.Synchronized,
      ctx.Native,
      ctx.Strictfp
    ].filter(x => x !== undefined).map(x => x ? x[0].image : x);
    this.modifiers.push(possibleModifiers[0] as string);
  }

  result(ctx: ResultCtx) {
    if (ctx.Void) {
      this.returnType = ctx.Void[0].image;
    }
  }

  methodDeclarator(ctx: MethodDeclaratorCtx) {
    this.name = ctx.Identifier[0].image;
    if (ctx.formalParameterList) {
      this.visit(ctx.formalParameterList);
    }
  }

  formalParameter(ctx: FormalParameterCtx) {
    if (ctx.variableParaRegularParameter) {
      this.visit(ctx.variableParaRegularParameter);
    } else if (ctx.variableArityParameter) {
      this.visit(ctx.variableArityParameter);
    }

    const argName = this.getAndPop();
    const typeName = this.getAndPop();
    this.params.push({
      typeName: typeName,
      argName: argName,
    });
  }

  unannClassType(ctx: UnannClassTypeCtx) {
    this.stack.push(ctx.Identifier[0].image);
  }

  dims(ctx: DimsCtx) {
    this.stack[this.stack.length - 1] += "[]";
  }

  variableDeclaratorId(ctx: VariableDeclaratorIdCtx) {
    this.stack.push(ctx.Identifier[0].image);
  }
}

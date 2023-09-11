import {
  CstNode,
  DimsCtx,
  FormalParameterCtx,
  FormalParameterListCtx,
  MethodDeclaratorCtx,
  MethodModifierCtx,
  ResultCtx,
  UnannClassTypeCtx,
  VariableDeclaratorIdCtx,
} from "java-parser";

import { BaseJavaCstVisitorWithDefaults } from "java-parser";
import { MethodModifier, MethodBody, MethodDeclaration, Identifier, FormalParameter } from "../types/classes";

export class MethodExtractor extends BaseJavaCstVisitorWithDefaults {
  private stack: Array<string> = [];
  private modifier: Array<MethodModifier>;
  private identifier: Identifier;
  private params: Array<FormalParameter>;
  private body: MethodBody;

  constructor() {
    super();
    this.stack = [];
    this.modifier = [];
    this.identifier = '';
    this.params = [];
    this.body = [];
    this.validateVisitor();
  }

  private getAndPop() {
    const res = this.stack.at(-1);
    this.stack.pop();
    return res as string;
  }

  extract(cst: CstNode): MethodDeclaration {
    this.stack = [];
    this.modifier = [];
    this.identifier = '';
    this.params = [];
    this.body = [];
    this.visit(cst);
    return {
      methodModifier: this.modifier,
      methodHeader: {
        result: "void",
        methodDeclarator: {
          identifier: this.identifier,
          formalParameterList: this.params
        }
      },
      methodBody: this.body,
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
    this.modifier.push(possibleModifiers[0] as MethodModifier);
  }

  methodDeclarator(ctx: MethodDeclaratorCtx) {
    this.identifier = ctx.Identifier[0].image;
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
      unannType: typeName,
      variableDeclaratorId: argName,
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

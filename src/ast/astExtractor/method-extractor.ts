import {
  BlockStatementsCtx,
  CstNode,
  DimsCtx,
  FormalParameterCtx,
  MethodDeclaratorCtx,
  MethodModifierCtx,
  UnannClassTypeCtx,
  VariableDeclaratorIdCtx,
} from "java-parser";

import { BaseJavaCstVisitorWithDefaults } from "java-parser";
import { MethodModifier, MethodDeclaration, Identifier, FormalParameter } from "../types/classes";
import { BlockStatementExtractor } from "./block-statement-extractor";
import { BlockStatement } from "../types/blocks-and-statements";

export class MethodExtractor extends BaseJavaCstVisitorWithDefaults {
  private stack: Array<string> = [];
  private modifier: Array<MethodModifier>;
  private identifier: Identifier;
  private params: Array<FormalParameter>;
  private body: Array<BlockStatement>;

  constructor() {
    super();
    this.stack = [];
    this.modifier = [];
    this.identifier = '';
    this.params = [];
    this.body = [];
  }

  private getAndPop() {
    const res = this.stack[this.stack.length - 1];
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
      kind: "MethodDeclaration",
      methodModifier: this.modifier,
      methodHeader: {
        result: "void",
        identifier: this.identifier,
        formalParameterList: this.params
      },
      methodBody: {
        kind: "Block",
        blockStatements:this.body,
      },
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
      kind: "FormalParameter",
      unannType: typeName,
      identifier: argName,
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

  blockStatements(ctx: BlockStatementsCtx) {
    ctx.blockStatement.forEach(x => {
      const blockStatementExtractor = new BlockStatementExtractor();
      this.body.push(blockStatementExtractor.extract(x));
    })
  }
}

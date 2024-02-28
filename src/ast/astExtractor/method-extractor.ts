import {
  BaseJavaCstVisitorWithDefaults,
  BlockStatementsCtx,
  FormalParameterCtx,
  FormalParameterListCtx,
  MethodDeclarationCstNode,
  MethodDeclaratorCtx,
  MethodModifierCtx,
  ResultCtx,
  VariableArityParameterCtx,
  VariableDeclaratorIdCtx,
  VariableParaRegularParameterCtx,
} from "java-parser";

import {
  MethodModifier,
  MethodDeclaration,
  Identifier,
  FormalParameter,
  Result,
} from "../types/classes";
import { BlockStatementExtractor } from "./block-statement-extractor";
import { BlockStatement } from "../types/blocks-and-statements";
import { TypeExtractor } from "./type-extractor";

export class MethodExtractor extends BaseJavaCstVisitorWithDefaults {
  private modifier: Array<MethodModifier> = [];
  private res: Result;
  private identifier: Identifier;
  private params: Array<FormalParameter> = [];
  private body: Array<BlockStatement> = [];

  extract(cst: MethodDeclarationCstNode): MethodDeclaration {
    this.visit(cst);
    return {
      kind: "MethodDeclaration",
      methodModifier: this.modifier,
      methodHeader: {
        result: this.res,
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

  result(ctx: ResultCtx) {
    const typeExtractor = new TypeExtractor();
    if (ctx.unannType) {
      this.res = typeExtractor.extract(ctx.unannType[0]);
    } else /* if (ctx.Void) */ {
      this.res = "void";
    }
  }

  methodDeclarator(ctx: MethodDeclaratorCtx) {
    this.identifier = ctx.Identifier[0].image;
    if (ctx.formalParameterList) {
      this.params = this.visit(ctx.formalParameterList);
    }
  }

  formalParameterList(ctx: FormalParameterListCtx) {
    return ctx.formalParameter.map(p => this.visit(p));
  }

  formalParameter(ctx: FormalParameterCtx) {
    if (ctx.variableParaRegularParameter) {
      return this.visit(ctx.variableParaRegularParameter);
    } else /* if (ctx.variableArityParameter) */ {
      return this.visit(ctx.variableArityParameter!);
    }
  }

  variableParaRegularParameter(ctx: VariableParaRegularParameterCtx) {
    const typeExtractor = new TypeExtractor();
    return {
      kind: "FormalParameter",
      unannType: typeExtractor.extract(ctx.unannType[0]),
      identifier: this.visit(ctx.variableDeclaratorId),
    } as FormalParameter;
  }

  variableArityParameter(ctx: VariableArityParameterCtx) {
    const typeExtractor = new TypeExtractor();
    return {
      kind: "FormalParameter",
      unannType: typeExtractor.extract(ctx.unannType[0]),
      identifier: ctx.Identifier[0].image,
    } as FormalParameter;
  }

  variableDeclaratorId(ctx: VariableDeclaratorIdCtx) {
    return ctx.Identifier[0].image;
  }

  blockStatements(ctx: BlockStatementsCtx) {
    ctx.blockStatement.forEach(x => {
      const blockStatementExtractor = new BlockStatementExtractor();
      this.body.push(blockStatementExtractor.extract(x));
    })
  }
}

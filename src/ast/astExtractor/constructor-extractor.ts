import {
  BaseJavaCstVisitorWithDefaults,
  BlockStatementsCtx,
  ConstructorDeclarationCstNode,
  ConstructorModifierCtx,
  FormalParameterCtx,
  FormalParameterListCtx,
  SimpleTypeNameCtx,
  VariableArityParameterCtx,
  VariableDeclaratorIdCtx,
  VariableParaRegularParameterCtx,
} from "java-parser";

import {
  Identifier,
  FormalParameter,
  ConstructorModifier,
  ConstructorDeclaration,
} from "../types/classes";
import { BlockStatement } from "../types/blocks-and-statements";
import { BlockStatementExtractor } from "./block-statement-extractor";
import { TypeExtractor } from "./type-extractor";

export class ConstructorExtractor extends BaseJavaCstVisitorWithDefaults {
  private modifier: Array<ConstructorModifier> = [];
  private identifier: Identifier;
  private params: Array<FormalParameter> = [];
  private body: Array<BlockStatement> = [];

  extract(cst: ConstructorDeclarationCstNode): ConstructorDeclaration {
    this.visit(cst);
    return {
      kind: "ConstructorDeclaration",
      constructorModifier: this.modifier,
      constructorDeclarator: {
        identifier: this.identifier,
        formalParameterList: this.params,
      },
      constructorBody: {
        kind: "Block",
        blockStatements:this.body,
      },
    };
  }

  constructorModifier(ctx: ConstructorModifierCtx) {
    const possibleModifiers = [
      ctx.Public,
      ctx.Protected,
      ctx.Private,
    ].filter(x => x !== undefined).map(x => x ? x[0].image : x);
    this.modifier.push(possibleModifiers[0] as ConstructorModifier);
  }
  
  simpleTypeName(ctx: SimpleTypeNameCtx) {
    this.identifier = ctx.Identifier[0].image;
  }

  formalParameterList(ctx: FormalParameterListCtx) {
    this.params = ctx.formalParameter.map(p => this.visit(p));
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

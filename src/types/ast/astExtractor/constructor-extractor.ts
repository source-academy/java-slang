import {
  ArgumentListCtx,
  BaseJavaCstVisitorWithDefaults,
  BlockStatementsCtx,
  ConstructorDeclarationCstNode,
  ConstructorModifierCtx,
  FormalParameterCtx,
  FormalParameterListCtx,
  SimpleTypeNameCtx,
  UnqualifiedExplicitConstructorInvocationCtx,
  VariableArityParameterCtx,
  VariableDeclaratorIdCtx,
  VariableParaRegularParameterCtx
} from 'java-parser'

import {
  Identifier,
  FormalParameter,
  ConstructorModifier,
  ConstructorDeclaration
} from '../types/classes'
import { BlockStatement, ExplicitConstructorInvocation } from '../types/blocks-and-statements'
import { Location } from '../types'
import { BlockStatementExtractor } from './block-statement-extractor'
import { TypeExtractor } from './type-extractor'
import { ExpressionExtractor } from './expression-extractor'

export class ConstructorExtractor extends BaseJavaCstVisitorWithDefaults {
  private modifier: Array<ConstructorModifier> = []
  private identifier: Identifier
  private params: Array<FormalParameter> = []
  private body: Array<BlockStatement> = []
  private location: Location

  extract(cst: ConstructorDeclarationCstNode): ConstructorDeclaration {
    this.location = cst.location
    this.visit(cst)
    return {
      kind: 'ConstructorDeclaration',
      constructorModifier: this.modifier,
      constructorDeclarator: {
        identifier: this.identifier,
        formalParameterList: this.params
      },
      constructorBody: {
        kind: 'Block',
        blockStatements: this.body,
        location: this.location
      },
      location: this.location
    }
  }

  constructorModifier(ctx: ConstructorModifierCtx) {
    const possibleModifiers = [ctx.Public, ctx.Protected, ctx.Private]
      .filter(x => x !== undefined)
      .map(x => (x ? x[0].image : x))
    this.modifier.push(possibleModifiers[0] as ConstructorModifier)
  }

  simpleTypeName(ctx: SimpleTypeNameCtx) {
    this.identifier = ctx.Identifier[0].image
  }

  formalParameterList(ctx: FormalParameterListCtx) {
    this.params = ctx.formalParameter.map(p => this.visit(p))
  }

  formalParameter(ctx: FormalParameterCtx) {
    if (ctx.variableParaRegularParameter) {
      return this.visit(ctx.variableParaRegularParameter)
    } /* if (ctx.variableArityParameter) */ else {
      return this.visit(ctx.variableArityParameter!)
    }
  }

  variableParaRegularParameter(ctx: VariableParaRegularParameterCtx) {
    const typeExtractor = new TypeExtractor()
    return {
      kind: 'FormalParameter',
      unannType: typeExtractor.extract(ctx.unannType[0]),
      identifier: this.visit(ctx.variableDeclaratorId)
    } as FormalParameter
  }

  variableArityParameter(ctx: VariableArityParameterCtx) {
    const typeExtractor = new TypeExtractor()
    return {
      kind: 'FormalParameter',
      unannType: typeExtractor.extract(ctx.unannType[0]),
      identifier: ctx.Identifier[0].image
    } as FormalParameter
  }

  variableDeclaratorId(ctx: VariableDeclaratorIdCtx) {
    return ctx.Identifier[0].image
  }

  blockStatements(ctx: BlockStatementsCtx) {
    ctx.blockStatement.forEach(x => {
      const blockStatementExtractor = new BlockStatementExtractor()
      this.body.push(blockStatementExtractor.extract(x))
    })
  }

  unqualifiedExplicitConstructorInvocation(ctx: UnqualifiedExplicitConstructorInvocationCtx) {
    const expConInv = {
      kind: 'ExplicitConstructorInvocation',
      thisOrSuper: ctx.This?.[0].image || ctx.Super?.[0].image,
      argumentList: ctx.argumentList ? this.visit(ctx.argumentList) : [],
      location: this.location
    } as ExplicitConstructorInvocation
    this.body.push(expConInv)
  }

  argumentList(ctx: ArgumentListCtx) {
    const expressionExtractor = new ExpressionExtractor()
    return ctx.expression.map(e => expressionExtractor.extract(e))
  }
}

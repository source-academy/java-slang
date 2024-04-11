import {
  BaseJavaCstVisitorWithDefaults,
  FieldDeclarationCstNode,
  FieldModifierCtx,
  VariableDeclaratorIdCtx,
  VariableInitializerCtx
} from 'java-parser'

import { Expression } from '../types/blocks-and-statements'
import { Identifier, FieldDeclaration, FieldModifier } from '../types/classes'
import { Location } from '../types'
import { ExpressionExtractor } from './expression-extractor'
import { TypeExtractor } from './type-extractor'

export class FieldExtractor extends BaseJavaCstVisitorWithDefaults {
  private modifier: Array<FieldModifier> = []
  private identifier: Identifier
  private value: Expression

  extract(cst: FieldDeclarationCstNode): FieldDeclaration {
    this.visit(cst)
    const typeExtractor = new TypeExtractor()
    return {
      kind: 'FieldDeclaration',
      fieldModifier: this.modifier,
      fieldType: typeExtractor.extract(cst.children.unannType[0]),
      variableDeclaratorList: [
        {
          kind: 'VariableDeclarator',
          variableDeclaratorId: this.identifier,
          variableInitializer: this.value
        }
      ],
      location: cst.location as Location
    }
  }

  fieldModifier(ctx: FieldModifierCtx) {
    const possibleModifiers = [
      ctx.Public,
      ctx.Protected,
      ctx.Private,
      ctx.Static,
      ctx.Final,
      ctx.Transient,
      ctx.Volatile
    ]
      .filter(x => x !== undefined)
      .map(x => (x ? x[0].image : x))
    possibleModifiers.map(m => this.modifier.push(m as FieldModifier))
  }

  variableDeclaratorId(ctx: VariableDeclaratorIdCtx) {
    this.identifier = ctx.Identifier[0].image
  }

  variableInitializer(ctx: VariableInitializerCtx) {
    if (ctx.expression) {
      const expressionExtractor = new ExpressionExtractor()
      this.value = expressionExtractor.extract(ctx.expression[0])
    }
  }
}

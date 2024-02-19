import {
  BaseJavaCstVisitorWithDefaults,
  FieldDeclarationCstNode,
  FieldModifierCtx,
  IntegralTypeCtx,
  UnannClassTypeCtx,
  VariableDeclaratorIdCtx,
  VariableInitializerCtx,
} from "java-parser";

import { Expression } from "../types/blocks-and-statements";
import { Identifier, FieldDeclaration, FieldModifier, UnannType } from "../types/classes";
import { ExpressionExtractor } from "./expression-extractor";

export class FieldExtractor extends BaseJavaCstVisitorWithDefaults {
  private modifier: Array<FieldModifier> = [];
  private type: UnannType;
  private identifier: Identifier;
  private value: Expression;

  extract(cst: FieldDeclarationCstNode): FieldDeclaration {
    this.visit(cst);
    return {
      kind: "FieldDeclaration",
      fieldModifier: this.modifier,
      fieldType: this.type,
      variableDeclaratorList: [
        {
          kind: "VariableDeclarator",
          variableDeclaratorId: this.identifier,
          variableInitializer: this.value,
        },
      ],
    };
  }

  fieldModifier(ctx: FieldModifierCtx) {
    const possibleModifiers = [
      ctx.Public,
      ctx.Protected,
      ctx.Private,
      ctx.Static,
      ctx.Final,
      ctx.Transient,
      ctx.Volatile,
    ].filter(x => x !== undefined).map(x => x ? x[0].image : x);
    possibleModifiers.map(m => this.modifier.push(m as FieldModifier));
  }

  integralType(ctx: IntegralTypeCtx) {
    ctx.Byte && (this.type = ctx.Byte[0].image);
    ctx.Char && (this.type = ctx.Char[0].image);
    ctx.Int && (this.type = ctx.Int[0].image);
    ctx.Long && (this.type = ctx.Long[0].image);
    ctx.Short && (this.type = ctx.Short[0].image);
  }

  unannClassType(ctx: UnannClassTypeCtx) {
    this.type = ctx.Identifier[0].image;
  }

  variableDeclaratorId(ctx: VariableDeclaratorIdCtx) {
    this.identifier = ctx.Identifier[0].image;
  }

  variableInitializer(ctx: VariableInitializerCtx) {
    if (ctx.expression) {
      const expressionExtractor = new ExpressionExtractor();
      this.value = expressionExtractor.extract(ctx.expression[0]);
    }
  }
}

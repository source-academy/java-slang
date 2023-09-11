import {
  ClassMemberDeclarationCtx,
  ClassModifierCtx,
  CstNode,
  TypeIdentifierCtx,
} from "java-parser";

import { BaseJavaCstVisitorWithDefaults } from "java-parser";
import { ClassModifier, Identifier, ClassBodyDeclaration, ClassDeclaration } from "../types/classes";
import { MethodExtractor } from "./method-extractor";

export class ClassExtractor extends BaseJavaCstVisitorWithDefaults {
  private modifier: Array<ClassModifier>;
  private identifier: Identifier;
  private body: Array<ClassBodyDeclaration>;

  constructor() {
    super();
    this.modifier = [];
    this.identifier = '';
    this.body = [];
    this.validateVisitor();
  }

  extract(cst: CstNode): ClassDeclaration {
    this.modifier = [];
    this.identifier = '';
    this.body = [];
    this.visit(cst);
    return {
      classModifier: this.modifier,
      typeIdentifier: this.identifier,
      classBody: this.body,
    };
  }

  classModifier(ctx: ClassModifierCtx) {
    const possibleModifiers = [
      ctx.Public,
      ctx.Protected,
      ctx.Private,
      ctx.Abstract,
      ctx.Static,
      ctx.Final,
      ctx.Sealed,
      ctx.NonSealed,
      ctx.Strictfp
    ].filter(x => x !== undefined).map(x => x ? x[0].image : x);
    this.modifier.push(possibleModifiers[0] as ClassModifier);
  }

  typeIdentifier(ctx: TypeIdentifierCtx) {
    this.identifier = ctx.Identifier[0].image;
  }

  classMemberDeclaration(ctx: ClassMemberDeclarationCtx) {
    if (ctx.methodDeclaration) {
      ctx.methodDeclaration.forEach(x => {
        const methodExtractor = new MethodExtractor();
        const methodNode = methodExtractor.extract(x);
        this.body.push(methodNode);
      })
    }
  }
}

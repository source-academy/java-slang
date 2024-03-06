import {
  BaseJavaCstVisitorWithDefaults,
  ClassBodyDeclarationCtx,
  ClassMemberDeclarationCtx,
  ClassModifierCtx,
  CstNode,
  TypeIdentifierCtx,
} from "java-parser";

import {
  ClassModifier,
  Identifier,
  ClassBodyDeclaration,
  ClassDeclaration,
  NormalClassDeclaration
} from "../types/classes";
import { ConstructorExtractor } from "./constructor-extractor";
import { FieldExtractor } from "./field-extractor";
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
  }

  extract(cst: CstNode): ClassDeclaration {
    this.modifier = [];
    this.identifier = '';
    this.body = [];
    this.visit(cst);
    return {
      kind: "NormalClassDeclaration",
      classModifier: this.modifier,
      typeIdentifier: this.identifier,
      classBody: this.body,
    } as NormalClassDeclaration;
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

  classBodyDeclaration(ctx: ClassBodyDeclarationCtx) {
    if (ctx.constructorDeclaration) {
      ctx.constructorDeclaration.forEach(x => {
        const constructorExtractor = new ConstructorExtractor();
        const constructorNode = constructorExtractor.extract(x);
        this.body.push(constructorNode);
      })
    }
    if (ctx.classMemberDeclaration) {
      this.visit(ctx.classMemberDeclaration);
    }
  }

  classMemberDeclaration(ctx: ClassMemberDeclarationCtx) {
    if (ctx.fieldDeclaration) {
      ctx.fieldDeclaration.forEach(x => {
        const fieldExtractor = new FieldExtractor();
        const fieldNode = fieldExtractor.extract(x);
        this.body.push(fieldNode);
      })
    }
    if (ctx.methodDeclaration) {
      ctx.methodDeclaration.forEach(x => {
        const methodExtractor = new MethodExtractor();
        const methodNode = methodExtractor.extract(x);
        this.body.push(methodNode);
      })
    }
  }
}

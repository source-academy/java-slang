import {
  ClassMemberDeclarationCtx,
  ClassModifierCtx,
  CstNode,
  TypeIdentifierCtx,
} from "java-parser";

import { BaseJavaCstVisitorWithDefaults } from "java-parser";
import { ClassNode, Modifiers, MethodNode } from "../ast/types";
import { MethodExtractor } from "./method-extractor";

export class ClassExtractor extends BaseJavaCstVisitorWithDefaults {
  private modifiers: Modifiers;
  private name: string;
  private methods: Array<MethodNode>;

  constructor() {
    super();
    this.modifiers = [];
    this.name = '';
    this.methods = [];
    this.validateVisitor();
  }

  extract(cst: CstNode): ClassNode {
    this.modifiers = [];
    this.name = '';
    this.methods = [];
    this.visit(cst);
    return {
      type: 'class',
      modifiers: this.modifiers,
      name: this.name,
      body: {
        methods: this.methods
      }
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
    this.modifiers.push(possibleModifiers[0] as string);
  }

  typeIdentifier(ctx: TypeIdentifierCtx) {
    this.name = ctx.Identifier[0].image;
  }

  classMemberDeclaration(ctx: ClassMemberDeclarationCtx) {
    if (ctx.methodDeclaration) {
      ctx.methodDeclaration.forEach(x => {
        const methodExtractor = new MethodExtractor();
        const methodNode = methodExtractor.extract(x);
        this.methods.push(methodNode);
      })
    }
  }
}

import {
  CstNode,
  TypeDeclarationCtx,
} from "java-parser";

import { BaseJavaCstVisitorWithDefaults } from "java-parser";
import { AST } from "../types/packages-and-modules";
import { ClassExtractor } from "./class-extractor";

export class ASTExtractor extends BaseJavaCstVisitorWithDefaults {
  private ast: AST;

  constructor() {
    super();
    this.ast = [];
    this.validateVisitor();
  }

  extract(cst: CstNode): AST {
    this.ast = [];
    this.visit(cst);
    return this.ast;
  }

  typeDeclaration(ctx: TypeDeclarationCtx, param?: any) {
    if (ctx.classDeclaration) {
      ctx.classDeclaration.forEach(x => {
        const classExtractor = new ClassExtractor();
        this.ast.push(classExtractor.extract(x));
      });
    }
  }
}
import { AST } from "../types/packages-and-modules";
import { BaseJavaCstVisitorWithDefaults } from "java-parser";
import { ClassExtractor } from "./class-extractor";
import { CstNode, TypeDeclarationCtx } from "java-parser";

export class ASTExtractor extends BaseJavaCstVisitorWithDefaults {
  private ast: AST;

  constructor() {
    super();
    this.ast = {
      kind: "CompilationUnit",
      topLevelClassOrInterfaceDeclarations: [],
    };
  }

  extract(cst: CstNode): AST {
    this.ast.topLevelClassOrInterfaceDeclarations = [];
    this.visit(cst);
    return this.ast;
  }

  typeDeclaration(ctx: TypeDeclarationCtx, param?: any) {
    if (ctx.classDeclaration) {
      ctx.classDeclaration.forEach((x) => {
        const classExtractor = new ClassExtractor();
        this.ast.topLevelClassOrInterfaceDeclarations.push(
          classExtractor.extract(x)
        );
      });
    }
  }
}

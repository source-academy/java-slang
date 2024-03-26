import { BaseJavaCstVisitorWithDefaults, CstNode, TypeDeclarationCtx } from "java-parser";

import { NormalClassDeclaration } from "../types/classes";
import { AST } from "../types/packages-and-modules";
import { ClassExtractor } from "./class-extractor";

export class ASTExtractor extends BaseJavaCstVisitorWithDefaults {
  private topLevelClassOrInterfaceDeclarations: NormalClassDeclaration[] = [];

  extract(cst: CstNode): AST {
    this.visit(cst);
    return {
      kind: "CompilationUnit",
      importDeclarations: [],
      topLevelClassOrInterfaceDeclarations: this.topLevelClassOrInterfaceDeclarations,
      location: cst.location,
    }
  }

  typeDeclaration(ctx: TypeDeclarationCtx) {
    if (ctx.classDeclaration) {
      ctx.classDeclaration.forEach((x) => {
        const classExtractor = new ClassExtractor();
        this.topLevelClassOrInterfaceDeclarations.push(
          classExtractor.extract(x)
        );
      });
    }
  }
}

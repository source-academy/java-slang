import { BaseJavaCstVisitorWithDefaults, CstNode, TypeDeclarationCtx } from 'java-parser'

import { NormalClassDeclaration } from '../types/classes'
import { AST, Location } from '../types'
import { ClassExtractor } from './class-extractor'

export class ASTExtractor extends BaseJavaCstVisitorWithDefaults {
  private topLevelClassOrInterfaceDeclarations: NormalClassDeclaration[] = []

  extract(cst: CstNode): AST {
    this.visit(cst)
    return {
      kind: 'CompilationUnit',
      importDeclarations: [],
      topLevelClassOrInterfaceDeclarations: this.topLevelClassOrInterfaceDeclarations,
      location: cst.location as Location
    }
  }

  typeDeclaration(ctx: TypeDeclarationCtx) {
    if (ctx.classDeclaration) {
      ctx.classDeclaration.forEach(x => {
        const classExtractor = new ClassExtractor()
        this.topLevelClassOrInterfaceDeclarations.push(classExtractor.extract(x))
      })
    }
  }
}

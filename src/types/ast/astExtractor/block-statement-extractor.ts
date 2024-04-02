import {
  ArrayInitializerCtx,
  BaseJavaCstVisitorWithDefaults,
  BlockStatementCstNode,
  LocalVariableDeclarationCtx,
  LocalVariableDeclarationStatementCtx,
  LocalVariableTypeCtx,
  VariableDeclaratorCtx,
  VariableDeclaratorIdCtx,
  VariableDeclaratorListCtx,
  VariableInitializerCtx,
  VariableInitializerListCtx
} from 'java-parser'
import {
  BlockStatement,
  LocalVariableDeclarationStatement,
  VariableDeclarator
} from '../types/blocks-and-statements'
import { ExpressionExtractor } from './expression-extractor'
import { StatementExtractor } from './statement-extractor'
import { TypeExtractor } from './type-extractor'

export class BlockStatementExtractor extends BaseJavaCstVisitorWithDefaults {
  extract(cst: BlockStatementCstNode): BlockStatement {
    this.visit(cst)
    if (cst.children.localVariableDeclarationStatement) {
      return this.visit(cst.children.localVariableDeclarationStatement)
    } /* if (cst.children.statement) */ else {
      const statementExtractor = new StatementExtractor()
      return statementExtractor.extract(cst.children.statement![0])
    }
  }

  localVariableDeclarationStatement(
    ctx: LocalVariableDeclarationStatementCtx
  ): LocalVariableDeclarationStatement {
    return {
      kind: 'LocalVariableDeclarationStatement',
      ...this.visit(ctx.localVariableDeclaration)
    }
  }

  localVariableDeclaration(
    ctx: LocalVariableDeclarationCtx
  ): Omit<LocalVariableDeclarationStatement, 'kind'> {
    return {
      localVariableType: this.visit(ctx.localVariableType),
      variableDeclaratorList: this.visit(ctx.variableDeclaratorList)
    }
  }

  localVariableType(ctx: LocalVariableTypeCtx) {
    const typeExtractor = new TypeExtractor()
    if (ctx.unannType) {
      return typeExtractor.extract(ctx.unannType[0])
    } else if (ctx.Var) {
      throw new Error('Not implemented')
    }
  }

  variableDeclaratorList(ctx: VariableDeclaratorListCtx) {
    return ctx.variableDeclarator.map(variableDeclarator => {
      return this.visit(variableDeclarator)
    })
  }

  variableDeclarator(ctx: VariableDeclaratorCtx): VariableDeclarator {
    return {
      kind: 'VariableDeclarator',
      variableDeclaratorId: this.visit(ctx.variableDeclaratorId),
      variableInitializer: ctx.variableInitializer ? this.visit(ctx.variableInitializer) : undefined
    }
  }

  variableDeclaratorId(ctx: VariableDeclaratorIdCtx) {
    return ctx.Identifier[0].image
  }

  variableInitializer(ctx: VariableInitializerCtx) {
    if (ctx.expression) {
      const expressionExtractor = new ExpressionExtractor()
      return expressionExtractor.extract(ctx.expression[0])
    } else if (ctx.arrayInitializer) {
      return this.visit(ctx.arrayInitializer)
    }
  }

  arrayInitializer(ctx: ArrayInitializerCtx) {
    if (ctx.variableInitializerList) {
      return this.visit(ctx.variableInitializerList)
    }
  }

  variableInitializerList(ctx: VariableInitializerListCtx) {
    return ctx.variableInitializer.map(variableInitializer => {
      return this.visit(variableInitializer)
    })
  }
}

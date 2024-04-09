import {
  BaseJavaCstVisitorWithDefaults,
  BlockStatementCstNode,
  LocalVariableDeclarationCtx,
  LocalVariableDeclarationStatementCtx,
  LocalVariableTypeCtx,
  VariableDeclaratorCtx,
  VariableDeclaratorIdCtx,
  VariableDeclaratorListCtx
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
    if (cst.children.localVariableDeclarationStatement) {
      return this.visit(cst.children.localVariableDeclarationStatement)
    } else if (cst.children.statement) {
      const statementExtractor = new StatementExtractor()
      return statementExtractor.extract(cst.children.statement[0])
    }
    throw new Error('not implemented')
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
    const variableDeclarator: { [key: string]: any } = { kind: 'VariableDeclarator' }
    variableDeclarator.variableDeclaratorId = this.visit(ctx.variableDeclaratorId)
    if (ctx.variableInitializer) {
      const expressionExtractor = new ExpressionExtractor()
      variableDeclarator.variableInitializer = expressionExtractor.visit(ctx.variableInitializer)
    }
    return variableDeclarator as VariableDeclarator
  }

  variableDeclaratorId(ctx: VariableDeclaratorIdCtx) {
    return ctx.Identifier[0].image
  }
}

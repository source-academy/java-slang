import {
  ArgumentListCtx,
  BaseJavaCstVisitorWithDefaults,
  BasicForStatementCtx,
  BlockCtx,
  BlockStatementsCtx,
  ForInitCtx,
  ForStatementCtx,
  ForUpdateCtx,
  IfStatementCtx,
  MethodInvocationSuffixCtx,
  ReturnStatementCtx,
  StatementCstNode,
  StatementExpressionCtx,
  StatementWithoutTrailingSubstatementCtx,
  WhileStatementCtx,
  LocalVariableDeclarationCtx,
  StatementExpressionListCtx,
  ExpressionStatementCtx,
  LocalVariableTypeCtx,
  VariableDeclaratorListCtx,
  VariableDeclaratorCtx,
  EnhancedForStatementCtx
} from 'java-parser'
import {
  BasicForStatement,
  EnhancedForStatement,
  ExpressionStatement,
  IfStatement,
  Statement,
  StatementExpression,
  VariableDeclarator
} from '../types/blocks-and-statements'
import { ExpressionExtractor } from './expression-extractor'
import { BlockStatementExtractor } from './block-statement-extractor'
import { TypeExtractor } from './type-extractor'
import { getLocation } from './utils'

export class StatementExtractor extends BaseJavaCstVisitorWithDefaults {
  constructor() {
    super()
  }

  extract(cst: StatementCstNode): Statement {
    if (cst.children.forStatement) {
      return this.visit(cst.children.forStatement)
    } else if (cst.children.ifStatement) {
      return this.visit(cst.children.ifStatement)
    } else if (cst.children.labeledStatement) {
      return this.visit(cst.children.labeledStatement)
    } else if (cst.children.statementWithoutTrailingSubstatement) {
      return this.visit(cst.children.statementWithoutTrailingSubstatement)
    } else if (cst.children.whileStatement) {
      return this.visit(cst.children.whileStatement)
    } else {
      return {
        kind: 'EmptyStatement'
      }
    }
  }

  statementWithoutTrailingSubstatement(ctx: StatementWithoutTrailingSubstatementCtx) {
    if (ctx.expressionStatement) {
      return this.visit(ctx.expressionStatement)
    } else if (ctx.block) {
      return this.visit(ctx.block)
    } else if (ctx.breakStatement) {
      return { kind: 'BreakStatement' }
    } else if (ctx.continueStatement) {
      return { kind: 'ContinueStatement' }
    } else if (ctx.returnStatement) {
      const returnStatementExp = this.visit(ctx.returnStatement)
      return {
        kind: 'ReturnStatement',
        exp: returnStatementExp,
        location: ctx.returnStatement[0].location
      }
    }
  }

  expressionStatement(ctx: ExpressionStatementCtx): ExpressionStatement {
    const stmtExp = this.visit(ctx.statementExpression)
    return {
      kind: 'ExpressionStatement',
      stmtExp,
      location: stmtExp.location
    }
  }

  statementExpression(ctx: StatementExpressionCtx) {
    const expressionExtractor = new ExpressionExtractor()
    return expressionExtractor.extract(ctx.expression[0])
  }

  returnStatement(ctx: ReturnStatementCtx) {
    if (ctx.expression) {
      const expressionExtractor = new ExpressionExtractor()
      return expressionExtractor.extract(ctx.expression[0])
    }
    return { kind: 'Void' }
  }

  methodInvocationSuffix(ctx: MethodInvocationSuffixCtx) {
    // MethodInvocation argumentList
    return ctx.argumentList ? this.visit(ctx.argumentList) : []
  }

  argumentList(ctx: ArgumentListCtx) {
    // MethodInvocation argumentList
    const expressionExtractor = new ExpressionExtractor()
    return ctx.expression.map(e => expressionExtractor.extract(e))
  }

  ifStatement(ctx: IfStatementCtx): IfStatement {
    const consequentStatements: StatementCstNode[] = []
    const alternateStatements: StatementCstNode[] = []
    ctx.statement.forEach(statement => {
      if (!ctx.Else) consequentStatements.push(statement)
      else
        statement.location.startOffset > ctx.Else[0].endOffset
          ? alternateStatements.push(statement)
          : consequentStatements.push(statement)
    })
    const expressionExtractor = new ExpressionExtractor()
    const result: Statement = {
      kind: 'IfStatement',
      condition: expressionExtractor.extract(ctx.expression[0]),
      consequent:
        consequentStatements.length > 0
          ? this.extract(consequentStatements[0])
          : { kind: 'EmptyStatement' }
    }
    if (alternateStatements.length === 0) return result
    return { ...result, alternate: this.extract(alternateStatements[0]) }
  }

  block(ctx: BlockCtx): Statement {
    if (ctx.blockStatements) return this.visit(ctx.blockStatements)
    return { kind: 'EmptyStatement' }
  }

  blockStatements(ctx: BlockStatementsCtx): Statement {
    return {
      kind: 'Block',
      blockStatements: ctx.blockStatement.map(blockStatement => {
        const blockStatementExtrator = new BlockStatementExtractor()
        return blockStatementExtrator.extract(blockStatement)
      })
    }
  }

  whileStatement(ctx: WhileStatementCtx) {
    const expressionExtractor = new ExpressionExtractor()
    const statementExtractor = new StatementExtractor()
    return {
      kind: 'WhileStatement',
      condition: expressionExtractor.extract(ctx.expression[0]),
      body: statementExtractor.extract(ctx.statement[0])
    }
  }

  forStatement(ctx: ForStatementCtx) {
    if (ctx.basicForStatement) {
      return this.visit(ctx.basicForStatement)
    } else if (ctx.enhancedForStatement) {
      return this.visit(ctx.enhancedForStatement)
    }
  }

  basicForStatement(ctx: BasicForStatementCtx): BasicForStatement {
    const expressionExtractor = new ExpressionExtractor()
    const statementExtractor = new StatementExtractor()
    return {
      kind: 'BasicForStatement',
      forInit: ctx.forInit ? this.visit(ctx.forInit) : [],
      condition: expressionExtractor.extract(ctx.expression![0]),
      forUpdate: ctx.forUpdate ? this.visit(ctx.forUpdate) : [],
      body: statementExtractor.extract(ctx.statement[0])
    }
  }

  forInit(ctx: ForInitCtx) {
    if (ctx.localVariableDeclaration) {
      return this.visit(ctx.localVariableDeclaration)
    } else if (ctx.statementExpressionList) {
      return this.visit(ctx.statementExpressionList)
    }
  }

  localVariableDeclaration(ctx: LocalVariableDeclarationCtx) {
    const { localVariableType, location } = this.visit(ctx.localVariableType)
    return {
      kind: 'LocalVariableDeclarationStatement',
      localVariableType: localVariableType,
      variableDeclaratorList: this.visit(ctx.variableDeclaratorList),
      location
    }
  }

  forUpdate(ctx: ForUpdateCtx) {
    return this.visit(ctx.statementExpressionList)
  }

  statementExpressionList(ctx: StatementExpressionListCtx) {
    const result: Array<StatementExpression> = []
    ctx.statementExpression.forEach(stmtExp => {
      result.push(this.visit(stmtExp))
    })
    return result
  }

  localVariableType(ctx: LocalVariableTypeCtx) {
    const typeExtractor = new TypeExtractor()
    if (ctx.unannType) {
      return {
        localVariableType: typeExtractor.extract(ctx.unannType[0]),
        location: ctx.unannType[0].location
      }
    }
    throw new Error('Unimplemented extractor.')
  }

  variableDeclaratorList(ctx: VariableDeclaratorListCtx) {
    return ctx.variableDeclarator.map(variableDeclarator => this.visit(variableDeclarator)).flat()
  }

  variableDeclarator(ctx: VariableDeclaratorCtx) {
    const declarations: VariableDeclarator[] = []
    ctx.variableDeclaratorId.forEach((variable, index) => {
      const expressionExtractor = new ExpressionExtractor()
      declarations.push({
        kind: 'VariableDeclarator',
        variableDeclaratorId: variable.children.Identifier[0].image,
        variableInitializer: expressionExtractor.extract(
          ctx.variableInitializer![index].children.expression![0]
        ),
        location: ctx.Equals ? getLocation(ctx.Equals[0]) : undefined
      })
    })
    return declarations
  }

  enhancedForStatement(ctx: EnhancedForStatementCtx): EnhancedForStatement {
    const blockStatementExtractor = new BlockStatementExtractor()
    const expressionExtractor = new ExpressionExtractor()
    const statementExtractor = new StatementExtractor()
    const { localVariableType } = blockStatementExtractor.visit(ctx.localVariableType)
    return {
      kind: 'EnhancedForStatement',
      localVariableType: localVariableType,
      variableDeclaratorId: blockStatementExtractor.visit(ctx.variableDeclaratorId),
      expression: expressionExtractor.extract(ctx.expression[0]),
      statement: statementExtractor.extract(ctx.statement[0]),
      location: getLocation(ctx.For[0])
    }
  }
}

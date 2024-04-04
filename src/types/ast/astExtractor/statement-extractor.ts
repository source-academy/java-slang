import {
  ArgumentListCtx,
  BaseJavaCstVisitorWithDefaults,
  BasicForStatementCtx,
  BinaryExpressionCtx,
  BlockCtx,
  BlockStatementsCtx,
  ExpressionCtx,
  FqnOrRefTypeCtx,
  FqnOrRefTypePartCommonCtx,
  FqnOrRefTypePartFirstCtx,
  FqnOrRefTypePartRestCtx,
  ForInitCtx,
  ForStatementCtx,
  ForUpdateCtx,
  IfStatementCtx,
  MethodInvocationSuffixCtx,
  PrimaryCtx,
  PrimaryPrefixCtx,
  PrimarySuffixCtx,
  ReturnStatementCtx,
  StatementCstNode,
  StatementExpressionCtx,
  StatementWithoutTrailingSubstatementCtx,
  TernaryExpressionCtx,
  UnaryExpressionCtx,
  WhileStatementCtx,
  LocalVariableDeclarationCtx,
  StatementExpressionListCtx,
  ExpressionStatementCtx,
  LocalVariableTypeCtx,
  VariableDeclaratorListCtx,
  VariableDeclaratorCtx
} from 'java-parser'
import {
  BasicForStatement,
  ExpressionStatement,
  IfStatement,
  MethodInvocation,
  Primary,
  Statement,
  StatementExpression,
  VariableDeclarator
} from '../types/blocks-and-statements'
import { Location } from '../types'
import { ExpressionExtractor } from './expression-extractor'
import { BlockStatementExtractor } from './block-statement-extractor'
import { TypeExtractor } from './type-extractor'

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
    return this.visit(ctx.expression)
  }

  returnStatement(ctx: ReturnStatementCtx) {
    if (ctx.expression) {
      const expressionExtractor = new ExpressionExtractor()
      return expressionExtractor.extract(ctx.expression[0])
    }
    return { kind: 'Void' }
  }

  expression(ctx: ExpressionCtx) {
    if (ctx.lambdaExpression) {
      throw new Error('Unimplemented extractor.')
    } else if (ctx.ternaryExpression) {
      return this.visit(ctx.ternaryExpression)
    }
  }

  ternaryExpression(ctx: TernaryExpressionCtx) {
    if (ctx.binaryExpression && ctx.QuestionMark && ctx.Colon && ctx.expression) {
      const expressionExtractor = new ExpressionExtractor()
      return expressionExtractor.ternaryExpression(ctx)
    }
    return this.visit(ctx.binaryExpression)
  }

  binaryExpression(ctx: BinaryExpressionCtx) {
    // Assignment
    if (ctx.AssignmentOperator && ctx.expression) {
      const expressionExtractor = new ExpressionExtractor()
      const left = this.visit(ctx.unaryExpression[0])
      return {
        kind: 'Assignment',
        left,
        operator: '=',
        right: expressionExtractor.extract(ctx.expression[0]),
        location: left.location
      }
    }
    // MethodInvocation
    return this.visit(ctx.unaryExpression[0])
  }

  unaryExpression(ctx: UnaryExpressionCtx) {
    if (ctx.UnaryPrefixOperator || ctx.UnarySuffixOperator) {
      const expressionExtractor = new ExpressionExtractor()
      return expressionExtractor.unaryExpression(ctx)
    }
    // Assignment LHS, MethodInvocation
    return this.visit(ctx.primary)
  }

  primary(ctx: PrimaryCtx): Primary {
    // Assignment LHS, MethodInvocation identifier
    let { name, location } = this.visit(ctx.primaryPrefix)
    if (ctx.primarySuffix) {
      const lastSuffix = ctx.primarySuffix[ctx.primarySuffix.length - 1]
      if (lastSuffix.children.arrayAccessSuffix) {
        const expressionExtractor = new ExpressionExtractor()
        const newPrimaryCtx: PrimaryCtx = { primaryPrefix: ctx.primaryPrefix }
        if (ctx.primarySuffix.length - 1 > 0) {
          const newSuffixArray = ctx.primarySuffix.filter(
            (_, index) => index !== ctx.primarySuffix!.length - 1
          )
          newPrimaryCtx.primarySuffix = newSuffixArray
        }
        return {
          ...expressionExtractor.visit(lastSuffix.children.arrayAccessSuffix),
          primary: this.primary(newPrimaryCtx)
        }
      }

      for (const s of ctx.primarySuffix.filter(s => !s.children.methodInvocationSuffix)) {
        name += '.' + this.visit(s)
      }

      // MethodInvocation
      if (ctx.primarySuffix[ctx.primarySuffix.length - 1].children.methodInvocationSuffix) {
        return {
          kind: 'MethodInvocation',
          identifier: name,
          argumentList: this.visit(ctx.primarySuffix[ctx.primarySuffix.length - 1]),
          location
        } as MethodInvocation
      }
    }
    return {
      kind: 'ExpressionName',
      name,
      location
    }
  }

  primaryPrefix(ctx: PrimaryPrefixCtx): { name: string; location: Location } {
    // Assignment LHS, MethodInvocation identifier
    if (ctx.fqnOrRefType) {
      return this.visit(ctx.fqnOrRefType)
    } else if (ctx.This) {
      const thisKeyword = ctx.This[0]
      return {
        name: thisKeyword.image,
        location: {
          startOffset: thisKeyword.startOffset,
          startLine: thisKeyword.startLine,
          startColumn: thisKeyword.startColumn,
          endOffset: thisKeyword.endOffset,
          endLine: thisKeyword.endLine,
          endColumn: thisKeyword.endColumn
        } as Location
      }
    }
    throw new Error('Unimplemeted extractor.')
  }

  primarySuffix(ctx: PrimarySuffixCtx) {
    // MethodInvocation argumentList
    if (ctx.methodInvocationSuffix) {
      return this.visit(ctx.methodInvocationSuffix)
    } else if (ctx.Identifier) {
      return ctx.Identifier[0].image
    }
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

  fqnOrRefType(ctx: FqnOrRefTypeCtx) {
    // Assignment LHS, MethodInvocation identifier
    let { name, location } = this.visit(ctx.fqnOrRefTypePartFirst)
    if (ctx.fqnOrRefTypePartRest) {
      for (const r of ctx.fqnOrRefTypePartRest) {
        name += '.' + this.visit(r).name
      }
    }
    return { name, location }
  }

  fqnOrRefTypePartFirst(ctx: FqnOrRefTypePartFirstCtx) {
    // Assignment LHS, MethodInvocation identifier
    return this.visit(ctx.fqnOrRefTypePartCommon)
  }

  fqnOrRefTypePartCommon(ctx: FqnOrRefTypePartCommonCtx) {
    // Assignment LHS, MethodInvocation identifier
    if (ctx.Identifier) {
      const identifier = ctx.Identifier[0]
      return {
        name: identifier.image,
        location: {
          startOffset: identifier.startOffset,
          startLine: identifier.startLine,
          startColumn: identifier.startColumn,
          endOffset: identifier.endOffset,
          endLine: identifier.endLine,
          endColumn: identifier.endColumn
        } as Location
      }
    }
    throw new Error('Unimplemented extractor.')
  }

  fqnOrRefTypePartRest(ctx: FqnOrRefTypePartRestCtx) {
    return this.visit(ctx.fqnOrRefTypePartCommon)
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
    return {
      kind: 'LocalVariableDeclarationStatement',
      localVariableType: this.visit(ctx.localVariableType),
      variableDeclaratorList: this.visit(ctx.variableDeclaratorList)
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
      return typeExtractor.extract(ctx.unannType[0])
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
        )
      })
    })
    return declarations
  }
}

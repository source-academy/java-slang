import {
  ArgumentListCtx,
  ArrayAccessSuffixCtx,
  BaseJavaCstVisitorWithDefaults,
  BinaryExpressionCtx,
  BooleanLiteralCtx,
  ClassOrInterfaceTypeToInstantiateCtx,
  ExpressionCstNode,
  ExpressionCtx,
  FloatingPointLiteralCtx,
  FqnOrRefTypeCtx,
  FqnOrRefTypePartCommonCtx,
  FqnOrRefTypePartFirstCtx,
  FqnOrRefTypePartRestCtx,
  IntegerLiteralCtx,
  IToken,
  LiteralCtx,
  MethodInvocationSuffixCtx,
  NewExpressionCtx,
  ParenthesisExpressionCtx,
  PrimaryCtx,
  PrimaryPrefixCtx,
  PrimarySuffixCstNode,
  PrimarySuffixCtx,
  TernaryExpressionCtx,
  UnaryExpressionCstNode,
  UnaryExpressionCtx,
  UnqualifiedClassInstanceCreationExpressionCtx
} from 'java-parser'
import {
  ArgumentList,
  ArrayAccess,
  Assignment,
  BinaryExpression,
  ClassInstanceCreationExpression,
  Expression,
  ExpressionName,
  FieldAccess,
  Primary
} from '../types/blocks-and-statements'
import { Location } from '../types/ast'
import { getLocation } from './utils'

export class ExpressionExtractor extends BaseJavaCstVisitorWithDefaults {
  private location: Location

  extract(cst: ExpressionCstNode): Expression {
    this.location = cst.location
    return this.visit(cst)
  }

  expression(ctx: ExpressionCtx) {
    if (ctx.ternaryExpression) {
      return this.visit(ctx.ternaryExpression)
    }
  }

  ternaryExpression(ctx: TernaryExpressionCtx) {
    if (ctx.binaryExpression && ctx.QuestionMark && ctx.Colon && ctx.expression) {
      const expressionExtractor = new ExpressionExtractor()
      const condition = this.visit(ctx.binaryExpression)
      return {
        kind: 'TernaryExpression',
        condition: condition,
        consequent: expressionExtractor.extract(ctx.expression[0]),
        alternate: expressionExtractor.extract(ctx.expression[1]),
        location: condition.location
      }
    }
    return this.visit(ctx.binaryExpression)
  }

  binaryExpression(ctx: BinaryExpressionCtx) {
    if (ctx.BinaryOperator && ctx.BinaryOperator.length > 0) {
      return this.makeBinaryExpression(ctx.BinaryOperator, ctx.unaryExpression)
    } else if (ctx.AssignmentOperator && ctx.expression) {
      const expressionExtractor = new ExpressionExtractor()
      return {
        kind: 'Assignment',
        left: this.visit(ctx.unaryExpression[0]),
        operator: '=',
        right: expressionExtractor.extract(ctx.expression[0]),
        location: this.location
      } as Assignment
    } else {
      return this.visit(ctx.unaryExpression[0])
    }
  }

  private makeBinaryExpression(
    operators: IToken[],
    operands: UnaryExpressionCstNode[]
  ): BinaryExpression {
    const [processedOperators, processedOperands] = this.processPrecedence(operators, operands)

    if (processedOperators.length == 0 && processedOperands.length == 1) {
      return processedOperands[0]
    }

    let res: BinaryExpression = {
      kind: 'BinaryExpression',
      operator: processedOperators[0],
      left: processedOperands[0],
      right: processedOperands[1],
      location: this.location
    }

    for (let i = 1; i < processedOperators.length; i++) {
      res = {
        kind: 'BinaryExpression',
        operator: processedOperators[i],
        left: res,
        right: processedOperands[i + 1],
        location: this.location
      }
    }

    return res
  }

  private isMulOp(op: IToken) {
    const mulOps = ['*', '/', '%']
    return mulOps.filter(mulOp => mulOp === op.image).length > 0
  }

  private processPrecedence(operators: IToken[], operands: UnaryExpressionCstNode[]) {
    const newOperators = []
    const newOperands = []

    let accMulRes

    for (let i = 0; i < operators.length; i++) {
      if (this.isMulOp(operators[i])) {
        if (accMulRes) {
          accMulRes = {
            kind: 'BinaryExpression',
            operator: operators[i].image,
            left: accMulRes,
            right: this.visit(operands[i + 1]),
            location: this.location
          }
        } else {
          accMulRes = {
            kind: 'BinaryExpression',
            operator: operators[i].image,
            left: this.visit(operands[i]),
            right: this.visit(operands[i + 1]),
            location: this.location
          }
        }
      } else {
        if (accMulRes) {
          newOperands.push(accMulRes)
          accMulRes = undefined
        } else {
          newOperands.push(this.visit(operands[i]))
        }
        newOperators.push(operators[i].image)
      }
    }

    if (this.isMulOp(operators[operators.length - 1])) {
      newOperands.push(accMulRes)
    } else {
      newOperands.push(this.visit(operands[operands.length - 1]))
    }

    return [newOperators, newOperands]
  }

  unaryExpression(ctx: UnaryExpressionCtx) {
    const node = this.visit(ctx.primary)
    if (ctx.UnaryPrefixOperator) {
      return {
        kind: 'PrefixExpression',
        operator: ctx.UnaryPrefixOperator[0].image,
        expression: node,
        location: this.location
      }
    } else if (ctx.UnarySuffixOperator) {
      const suffixOp = ctx.UnarySuffixOperator[0]
      return {
        kind: 'PostfixExpression',
        operator: suffixOp.image,
        expression: node,
        location: {
          startOffset: suffixOp.startOffset,
          startLine: suffixOp.startLine,
          startColumn: suffixOp.startColumn,
          endOffset: suffixOp.endOffset,
          endLine: suffixOp.endLine,
          endColumn: suffixOp.endColumn
        }
      }
    }
    return node
  }

  primary(ctx: PrimaryCtx): Primary {
    if (ctx.primarySuffix) {
      const lastSuffix = ctx.primarySuffix[ctx.primarySuffix.length - 1]
      const newPrimaryCtx: PrimaryCtx = { primaryPrefix: ctx.primaryPrefix }
      const primarySuffix: PrimarySuffixCstNode[] = []
      for (let i = 0; i < ctx.primarySuffix.length - 1; i++)
        primarySuffix.push(ctx.primarySuffix[i])
      if (primarySuffix.length > 0) newPrimaryCtx.primarySuffix = primarySuffix
      const primary = this.primary(newPrimaryCtx)
      const primaryRest = this.visit(lastSuffix)
      if (!primaryRest) return {} as Primary // Temporary
      if (primary.kind === 'FieldAccess' && primaryRest.kind === 'MethodInvocation') {
        // example.test() -> primary: example.test, primaryRest: ()
        return {
          ...primaryRest,
          identifier: primary.identifier,
          location: primary.location,
          primary: primary.primary
        } as Primary
      }
      return { ...primaryRest, primary }
    }
    return this.visit(ctx.primaryPrefix) as Primary
  }

  primaryPrefix(ctx: PrimaryPrefixCtx) {
    if (ctx.This) {
      return { kind: 'This' }
    } else if (ctx.Void) {
      return { kind: 'Void' }
    } else if (ctx.castExpression) {
      throw new Error('not implemented')
    } else if (ctx.fqnOrRefType) {
      return this.visit(ctx.fqnOrRefType)
    } else if (ctx.literal) {
      return this.visit(ctx.literal)
    } else if (ctx.newExpression) {
      return this.visit(ctx.newExpression)
    } else if (ctx.parenthesisExpression) {
      return this.visit(ctx.parenthesisExpression)
    } else if (ctx.switchStatement) {
      throw new Error('not implemented')
    } else if (ctx.unannPrimitiveTypeWithOptionalDimsSuffix) {
      throw new Error('not implemented')
    }
  }

  primarySuffix(ctx: PrimarySuffixCtx) {
    if (ctx.methodInvocationSuffix) {
      return this.visit(ctx.methodInvocationSuffix)
    } else if (ctx.Dot && ctx.Identifier) {
      return {
        kind: 'FieldAccess',
        identifier: ctx.Identifier[0].image,
        location: getLocation(ctx.Identifier[0])
      }
    } else if (ctx.arrayAccessSuffix) {
      return this.visit(ctx.arrayAccessSuffix)
    }
  }

  methodInvocationSuffix(ctx: MethodInvocationSuffixCtx) {
    return {
      kind: 'MethodInvocation',
      argumentList: ctx.argumentList ? this.visit(ctx.argumentList) : []
    }
  }

  newExpression(ctx: NewExpressionCtx) {
    if (ctx.unqualifiedClassInstanceCreationExpression) {
      return this.visit(ctx.unqualifiedClassInstanceCreationExpression)
    }
  }

  unqualifiedClassInstanceCreationExpression(ctx: UnqualifiedClassInstanceCreationExpressionCtx) {
    return {
      kind: 'ClassInstanceCreationExpression',
      identifier: this.visit(ctx.classOrInterfaceTypeToInstantiate),
      argumentList: ctx.argumentList ? this.visit(ctx.argumentList) : [],
      location: this.location
    } as ClassInstanceCreationExpression
  }

  classOrInterfaceTypeToInstantiate(ctx: ClassOrInterfaceTypeToInstantiateCtx) {
    return ctx.Identifier[0].image
  }

  argumentList(ctx: ArgumentListCtx): ArgumentList {
    const argumentList: Expression[] = []
    ctx.expression.forEach(expression => {
      const expressionExtractor = new ExpressionExtractor()
      const argumentExpression = expressionExtractor.extract(expression)
      argumentList.push(argumentExpression)
    })
    return argumentList
  }

  fqnOrRefType(ctx: FqnOrRefTypeCtx) {
    const firstPart = this.visit(ctx.fqnOrRefTypePartFirst)
    if (ctx.Dot && ctx.fqnOrRefTypePartRest) {
      const expressionName = this.visit(ctx.fqnOrRefTypePartRest) as ExpressionName
      return {
        kind: 'FieldAccess',
        identifier: expressionName.name,
        primary: firstPart,
        location: expressionName.location
      } as FieldAccess
    }
    return firstPart
  }

  fqnOrRefTypePartFirst(ctx: FqnOrRefTypePartFirstCtx) {
    if (ctx.annotation) throw new Error('not implemented')
    return this.visit(ctx.fqnOrRefTypePartCommon)
  }

  fqnOrRefTypePartCommon(ctx: FqnOrRefTypePartCommonCtx) {
    if (ctx.Identifier) {
      return {
        kind: 'ExpressionName',
        name: ctx.Identifier[0].image,
        location: getLocation(ctx.Identifier[0])
      } as Primary
    }
    throw new Error('not implemented')
  }

  fqnOrRefTypePartRest(ctx: FqnOrRefTypePartRestCtx) {
    if (ctx.annotation) {
      throw new Error('not implemented')
    } else if (ctx.typeArguments) {
      throw new Error('not implemented')
    }
    return this.visit(ctx.fqnOrRefTypePartCommon)
  }

  literal(ctx: LiteralCtx) {
    if (ctx.integerLiteral) {
      return this.visit(ctx.integerLiteral)
    } else if (ctx.floatingPointLiteral) {
      return this.visit(ctx.floatingPointLiteral)
    } else if (ctx.booleanLiteral) {
      return this.visit(ctx.booleanLiteral)
    } else if (ctx.CharLiteral) {
      return {
        kind: 'Literal',
        literalType: {
          kind: 'CharacterLiteral',
          value: ctx.CharLiteral[0].image
        }
      }
    } else if (ctx.Null) {
      return {
        kind: 'Literal',
        literalType: {
          kind: 'NullLiteral',
          value: 'null'
        },
        location: this.location
      }
    } else if (ctx.TextBlock) {
      return {
        kind: 'Literal',
        literalType: {
          kind: 'StringLiteral',
          value: ctx.TextBlock[0].image
        }
      }
    } else if (ctx.StringLiteral) {
      return {
        kind: 'Literal',
        literalType: {
          kind: 'StringLiteral',
          value: ctx.StringLiteral[0].image
        },
        location: this.location
      }
    }
  }

  integerLiteral(ctx: IntegerLiteralCtx) {
    const literal = {
      kind: 'Literal',
      literalType: {},
      location: this.location
    }
    if (ctx.DecimalLiteral) {
      literal.literalType = {
        kind: 'DecimalIntegerLiteral',
        value: ctx.DecimalLiteral[0].image
      }
    } else if (ctx.HexLiteral) {
      literal.literalType = {
        kind: 'HexIntegerLiteral',
        value: ctx.HexLiteral[0].image
      }
    } else if (ctx.OctalLiteral) {
      literal.literalType = {
        kind: 'OctalIntegerLiteral',
        value: ctx.OctalLiteral[0].image
      }
    } else if (ctx.BinaryLiteral) {
      literal.literalType = {
        kind: 'BinaryIntegerLiteral',
        value: ctx.BinaryLiteral[0].image
      }
    }
    return literal
  }

  booleanLiteral(ctx: BooleanLiteralCtx) {
    return {
      kind: 'Literal',
      literalType: {
        kind: 'BooleanLiteral',
        value: ctx.False ? 'false' : ('true' as 'true' | 'false')
      }
    }
  }

  floatingPointLiteral(ctx: FloatingPointLiteralCtx) {
    const literal = { kind: 'Literal', literalType: {} }
    if (ctx.FloatLiteral) {
      literal.literalType = {
        kind: 'DecimalFloatingPointLiteral',
        value: ctx.FloatLiteral[0].image
      }
    } else if (ctx.HexFloatLiteral) {
      literal.literalType = {
        kind: 'HexadecimalFloatingPointLiteral',
        value: ctx.HexFloatLiteral[0].image
      }
    }
    return literal
  }

  parenthesisExpression(ctx: ParenthesisExpressionCtx) {
    return this.visit(ctx.expression)
  }

  arrayAccessSuffix(ctx: ArrayAccessSuffixCtx): Omit<ArrayAccess, 'primary'> {
    const expresionExtractor = new ExpressionExtractor()
    return {
      kind: 'ArrayAccess',
      expression: expresionExtractor.extract(ctx.expression[0]),
      location: getLocation(ctx.LSquare[0])
    }
  }
}

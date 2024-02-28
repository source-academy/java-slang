import {
  ArgumentListCtx,
  BaseJavaCstVisitorWithDefaults,
  BinaryExpressionCtx,
  ClassOrInterfaceTypeToInstantiateCtx,
  ExpressionCstNode,
  ExpressionCtx,
  FqnOrRefTypeCtx,
  FqnOrRefTypePartCommonCtx,
  FqnOrRefTypePartFirstCtx,
  IToken,
  IntegerLiteralCtx,
  LiteralCtx,
  MethodInvocationSuffixCtx,
  NewExpressionCtx,
  ParenthesisExpressionCtx,
  PrimaryCtx,
  PrimaryPrefixCtx,
  PrimarySuffixCtx,
  TernaryExpressionCtx,
  UnaryExpressionCstNode,
  UnaryExpressionCtx,
  UnqualifiedClassInstanceCreationExpressionCtx,
} from "java-parser";

import {
  Assignment,
  BinaryExpression,
  ClassInstanceCreationExpression,
  Expression,
  ExpressionName,
  MethodInvocation,
} from "../types/blocks-and-statements";

export class ExpressionExtractor extends BaseJavaCstVisitorWithDefaults {
  extract(cst: ExpressionCstNode): Expression {
    return this.visit(cst);
  }

  expression(ctx: ExpressionCtx) {
    if (ctx.ternaryExpression) {
      return this.visit(ctx.ternaryExpression);
    }
  }

  ternaryExpression(ctx: TernaryExpressionCtx) {
    return this.visit(ctx.binaryExpression);
  }

  binaryExpression(ctx: BinaryExpressionCtx) {
    if (ctx.BinaryOperator && ctx.BinaryOperator.length > 0) {
      return this.makeBinaryExpression(ctx.BinaryOperator, ctx.unaryExpression);
    } else if (ctx.AssignmentOperator && ctx.expression) {
      const expressionExtractor = new ExpressionExtractor();
      return {
        kind: "Assignment",
        left: this.visit(ctx.unaryExpression[0]),
        operator: "=",
        right: expressionExtractor.extract(ctx.expression[0]),
      } as Assignment;
    } else {
      return this.visit(ctx.unaryExpression[0]);
    }
  }

  private makeBinaryExpression(
    operators: IToken[],
    operands: UnaryExpressionCstNode[]
  ): BinaryExpression {
    const [processedOperators, processedOperands] = this.processPrecedence(
      operators,
      operands
    );

    if (processedOperators.length == 0 && processedOperands.length == 1) {
      return processedOperands[0];
    }

    let res: BinaryExpression = {
      kind: "BinaryExpression",
      operator: processedOperators[0],
      left: processedOperands[0],
      right: processedOperands[1],
    };

    for (let i = 1; i < processedOperators.length; i++) {
      res = {
        kind: "BinaryExpression",
        operator: processedOperators[i],
        left: res,
        right: processedOperands[i + 1],
      };
    }

    return res;
  }

  private isMulOp(op: IToken) {
    const mulOps = ["*", "/", "%"];
    return mulOps.filter((mulOp) => mulOp === op.image).length > 0;
  }

  private processPrecedence(operators: IToken[], operands: UnaryExpressionCstNode[]) {
    const newOperators = [];
    const newOperands = [];

    let accMulRes;

    for (let i = 0; i < operators.length; i++) {
      if (this.isMulOp(operators[i])) {
        if (accMulRes) {
          accMulRes = {
            kind: "BinaryExpression",
            operator: operators[i].image,
            left: accMulRes,
            right: this.visit(operands[i + 1]),
          };
        } else {
          accMulRes = {
            kind: "BinaryExpression",
            operator: operators[i].image,
            left: this.visit(operands[i]),
            right: this.visit(operands[i + 1]),
          };
        }
      } else {
        if (accMulRes) {
          newOperands.push(accMulRes);
          accMulRes = undefined;
        } else {
          newOperands.push(this.visit(operands[i]));
        }
        newOperators.push(operators[i].image);
      }
    }

    if (this.isMulOp(operators[operators.length - 1])) {
      newOperands.push(accMulRes);
    } else {
      newOperands.push(this.visit(operands[operands.length - 1]));
    }

    return [newOperators, newOperands];
  }

  unaryExpression(ctx: UnaryExpressionCtx) {
    const node = this.visit(ctx.primary);
    if (ctx.UnaryPrefixOperator) {
      return {
        kind: "PrefixExpression",
        operator: ctx.UnaryPrefixOperator[0].image,
        expression: node,
      };
    }
    return this.visit(ctx.primary);
  }

  primary(ctx: PrimaryCtx) {
    if (ctx.primarySuffix) {
      return {
        kind: "MethodInvocation",
        identifier: {
          kind: "MethodName",
          name: this.visit(ctx.primaryPrefix[0].children.fqnOrRefType!),
        },
        argumentList: this.visit(ctx.primarySuffix),
      } as MethodInvocation;
    }
    return this.visit(ctx.primaryPrefix);
  }

  primaryPrefix(ctx: PrimaryPrefixCtx) {
    if (ctx.literal) {
      return this.visit(ctx.literal);
    } else if (ctx.parenthesisExpression) {
      return this.visit(ctx.parenthesisExpression);
    } else if (ctx.fqnOrRefType) {
      return {
        kind: "ExpressionName",
        name: this.visit(ctx.fqnOrRefType),
      } as ExpressionName;
    } else if (ctx.newExpression) {
      return this.visit(ctx.newExpression);
    }
  }
  
  primarySuffix(ctx: PrimarySuffixCtx) {
    if (ctx.methodInvocationSuffix) {
      return this.visit(ctx.methodInvocationSuffix);
    }
  }

  methodInvocationSuffix(ctx: MethodInvocationSuffixCtx) {
    return ctx.argumentList ? this.visit(ctx.argumentList) : [];
  }

  newExpression(ctx: NewExpressionCtx) {
    if (ctx.unqualifiedClassInstanceCreationExpression) {
      return this.visit(ctx.unqualifiedClassInstanceCreationExpression);
    }
  }

  unqualifiedClassInstanceCreationExpression(ctx: UnqualifiedClassInstanceCreationExpressionCtx) {
    return {
      kind: "ClassInstanceCreationExpression",
      identifier: {
        kind: "ClassName",
        name: this.visit(ctx.classOrInterfaceTypeToInstantiate),
      },
      argumentList: ctx.argumentList ? this.visit(ctx.argumentList) : [],
    } as ClassInstanceCreationExpression;
  }

  classOrInterfaceTypeToInstantiate(ctx: ClassOrInterfaceTypeToInstantiateCtx) {
    return ctx.Identifier[0].image;
  }

  argumentList(ctx: ArgumentListCtx) {
    const expressionExtractor = new ExpressionExtractor();
    return ctx.expression.map(e => expressionExtractor.extract(e));
  }

  fqnOrRefType(ctx: FqnOrRefTypeCtx) {
    return this.visit(ctx.fqnOrRefTypePartFirst);
  }

  fqnOrRefTypePartFirst(ctx: FqnOrRefTypePartFirstCtx) {
    return this.visit(ctx.fqnOrRefTypePartCommon);
  }

  fqnOrRefTypePartCommon(ctx: FqnOrRefTypePartCommonCtx) {
    return ctx.Identifier && ctx.Identifier[0].image;
  }

  literal(ctx: LiteralCtx) {
    if (ctx.integerLiteral) {
      return this.visit(ctx.integerLiteral);
    } else if (ctx.StringLiteral) {
      return {
        kind: "Literal",
        literalType: {
          kind: "StringLiteral",
          value: ctx.StringLiteral[0].image,
        },
      };
    }
  }

  integerLiteral(ctx: IntegerLiteralCtx) {
    const literal = { kind: "Literal", literalType: {} };
    if (ctx.DecimalLiteral) {
      literal.literalType = {
        kind: "DecimalIntegerLiteral",
        value: ctx.DecimalLiteral[0].image,
      };
    } else if (ctx.HexLiteral) {
      literal.literalType = {
        kind: "HexIntegerLiteral",
        value: ctx.HexLiteral[0].image,
      };
    } else if (ctx.OctalLiteral) {
      literal.literalType = {
        kind: "OctalIntegerLiteral",
        value: ctx.OctalLiteral[0].image,
      };
    } else if (ctx.BinaryLiteral) {
      literal.literalType = {
        kind: "BinaryIntegerLiteral",
        value: ctx.BinaryLiteral[0].image,
      };
    }
    return literal;
  }

  parenthesisExpression(ctx: ParenthesisExpressionCtx) {
    return this.visit(ctx.expression);
  }
}

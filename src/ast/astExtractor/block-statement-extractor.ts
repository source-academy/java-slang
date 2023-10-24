import { Identifier, UnannType } from "../types/classes";
import {
  BaseJavaCstVisitorWithDefaults,
  BinaryExpressionCtx,
  BlockStatementCstNode,
  BooleanLiteralCtx,
  ExpressionCtx,
  FloatingPointLiteralCtx,
  FloatingPointTypeCtx,
  IToken,
  IntegerLiteralCtx,
  IntegralTypeCtx,
  LiteralCtx,
  ParenthesisExpressionCtx,
  PrimaryCtx,
  PrimaryPrefixCtx,
  TernaryExpressionCtx,
  UnannClassTypeCtx,
  UnannPrimitiveTypeCtx,
  UnaryExpressionCstNode,
  UnaryExpressionCtx,
  VariableDeclaratorIdCtx,
  VariableInitializerCtx,
} from "java-parser";
import {
  BinaryExpression,
  BlockStatement,
  Expression,
} from "../types/blocks-and-statements";

export class BlockStatementExtractor extends BaseJavaCstVisitorWithDefaults {
  private type: UnannType;
  private identifier: Identifier;
  private value: Expression;

  constructor() {
    super();
  }

  extract(cst: BlockStatementCstNode): BlockStatement {
    this.visit(cst);
    return {
      kind: "LocalVariableDeclarationStatement",
      localVariableType: this.type,
      variableDeclaratorList: [
        {
          kind: "VariableDeclarator",
          variableDeclaratorId: this.identifier,
          variableInitializer: this.value,
        }
      ],
    };
  }

  integralType(ctx: IntegralTypeCtx) {
    ctx.Byte && (this.type = ctx.Byte[0].image);
    ctx.Char && (this.type = ctx.Char[0].image);
    ctx.Int && (this.type = ctx.Int[0].image);
    ctx.Long && (this.type = ctx.Long[0].image);
    ctx.Short && (this.type = ctx.Short[0].image);
  }

  variableDeclaratorId(ctx: VariableDeclaratorIdCtx) {
    this.identifier = ctx.Identifier[0].image;
  }

  variableInitializer(ctx: VariableInitializerCtx) {
    ctx.expression && (this.value = this.visit(ctx.expression));
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
    } else {
      return this.visit(ctx.unaryExpression[0]);
    }
  }

  makeBinaryExpression(
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

  isMulOp(op: IToken) {
    const mulOps = ["*", "/", "%"];
    return mulOps.filter((mulOp) => mulOp === op.image).length > 0;
  }

  processPrecedence(operators: IToken[], operands: UnaryExpressionCstNode[]) {
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
    return this.visit(ctx.primaryPrefix);
  }

  primaryPrefix(ctx: PrimaryPrefixCtx) {
    if (ctx.literal) {
      return this.visit(ctx.literal);
    } else if (ctx.parenthesisExpression) {
      return this.visit(ctx.parenthesisExpression);
    }
  }

  literal(ctx: LiteralCtx) {
    if (ctx.integerLiteral) {
      return this.visit(ctx.integerLiteral);
    } else if (ctx.floatingPointLiteral) {
      return this.visit(ctx.floatingPointLiteral);
    } else if (ctx.booleanLiteral) {
      return this.visit(ctx.booleanLiteral);
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

  unannClassType(ctx: UnannClassTypeCtx) {
    this.type = ctx.Identifier[0].image;
  }

  floatingPointType(ctx: FloatingPointTypeCtx) {
    ctx.Double && (this.type = ctx.Double[0].image);
    ctx.Float && (this.type = ctx.Float[0].image);
  }

  floatingPointLiteral(ctx: FloatingPointLiteralCtx) {
    const literal = { kind: "Literal", literalType: {} };
    if (ctx.FloatLiteral) {
      literal.literalType = {
        kind: "DecimalFloatingPointLiteral",
        value: ctx.FloatLiteral[0].image,
      };
    } else if (ctx.HexFloatLiteral) {
      literal.literalType = {
        kind: "HexadecimalFloatingPointLiteral",
        value: ctx.HexFloatLiteral[0].image,
      };
    }
    return literal;
  }

  booleanLiteral(ctx: BooleanLiteralCtx) {
    return {
      kind: "Literal",
      literalType: {
        kind: "BooleanLiteral",
        value: ctx.False ? "false" : ("true" as "true" | "false"),
      },
    };
  }

  unannPrimitiveType(ctx: UnannPrimitiveTypeCtx) {
    ctx.Boolean && (this.type = ctx.Boolean[0].image);
    ctx.numericType && this.visit(ctx.numericType);
  }
}

import {
  BaseJavaCstVisitorWithDefaults,
  BinaryExpressionCtx,
  BlockStatementCstNode,
  BooleanLiteralCtx,
  ExpressionCtx,
  FloatingPointLiteralCtx,
  IToken,
  IntegerLiteralCtx,
  IntegralTypeCtx,
  LiteralCtx,
  ParenthesisExpressionCtx,
  PrimaryCtx,
  PrimaryPrefixCtx,
  TernaryExpressionCtx,
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
import { Identifier, UnannType } from "../types/classes";

export class BlockStatementExtractor extends BaseJavaCstVisitorWithDefaults {
  private type: UnannType;
  private identifier: Identifier;
  private value: Expression;

  constructor() {
    super();
    this.validateVisitor();
  }

  extract(cst: BlockStatementCstNode): BlockStatement {
    this.visit(cst);
    return {
      type: "LocalVariableDeclarationStatement",
      localVariableType: this.type,
      variableDeclarationList: {
        variableDeclaratorId: this.identifier,
        variableInitializer: this.value,
      },
    };
  }

  integralType(ctx: IntegralTypeCtx) {
    ctx.Int && (this.type = ctx.Int[0].image);
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

    let res = {
      type: "BinaryExpression",
      operator: processedOperators[0],
      left: processedOperands[0],
      right: processedOperands[1],
    };

    for (let i = 1; i < processedOperators.length; i++) {
      res = {
        type: "BinaryExpression",
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
            type: "BinaryExpression",
            operator: operators[i].image,
            left: accMulRes,
            right: this.visit(operands[i + 1]),
          };
        } else {
          accMulRes = {
            type: "BinaryExpression",
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
    } else if (ctx.CharLiteral) {
      return {
        type: "CharacterLiteral",
        value: ctx.CharLiteral[0].image,
      };
    } else if (ctx.TextBlock) {
      return {
        type: "StringLiteral",
        value: ctx.TextBlock[0].image,
      };
    } else if (ctx.StringLiteral) {
      return {
        type: "StringLiteral",
        value: ctx.StringLiteral[0].image,
      };
    } else if (ctx.Null) {
      return {
        type: "NullLiteral",
      };
    }
  }

  integerLiteral(ctx: IntegerLiteralCtx) {
    if (ctx.BinaryLiteral) {
      return {
        type: "BinaryLiteral",
        value: Number(ctx.BinaryLiteral[0].image),
      };
    } else if (ctx.DecimalLiteral) {
      return {
        type: "DecimalLiteral",
        value: Number(ctx.DecimalLiteral[0].image),
      };
    } else if (ctx.HexLiteral) {
      return {
        type: "HexLiteral",
        value: Number(ctx.HexLiteral[0].image),
      };
    } else if (ctx.OctalLiteral) {
      return {
        type: "OctalLiteral",
        value: Number(ctx.OctalLiteral[0].image),
      };
    }
  }

  floatingPointLiteral(ctx: FloatingPointLiteralCtx) {
    if (ctx.FloatLiteral) {
      return {
        type: "DecimalFloatingPointLiteral",
        value: ctx.FloatLiteral[0].image,
      };
    } else if (ctx.HexFloatLiteral) {
      return {
        type: "HexadecimalFloatingPointLiteral",
        value: ctx.HexFloatLiteral[0].image,
      };
    }
  }

  booleanLiteral(ctx: BooleanLiteralCtx) {
    if (ctx.False) {
      return { type: "BooleanLiteral", value: false };
    } else if (ctx.True) {
      return { type: "BooleanLiteral", value: true };
    }
  }

  parenthesisExpression(ctx: ParenthesisExpressionCtx) {
    return this.visit(ctx.expression);
  }
}

import { 
  BaseJavaCstVisitorWithDefaults, 
  BinaryExpressionCtx, 
  BlockStatementCstNode, 
  ExpressionCtx, 
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
  VariableInitializerCtx
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
      localVariableType: this.type,
      variableDeclarationList: {
        variableDeclaratorId: this.identifier,
        variableInitializer: this.value
      }
    };
  }

  integralType(ctx: IntegralTypeCtx) {
    ctx.Int && (this.type = ctx.Int[0].image);
  }

  variableDeclaratorId(ctx: VariableDeclaratorIdCtx) {
    this.identifier = ctx.Identifier[0].image
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

  makeBinaryExpression(operators: IToken[], operands: UnaryExpressionCstNode[]): BinaryExpression {
    if (operators.length == 1 && operands.length == 2) {
      return {
        operator: operators[0].image,
        left: this.visit(operands[0]),
        right: this.visit(operands[1])
      }
    }
    return {
      operator: operators[operators.length - 1].image,
      left: this.makeBinaryExpression(operators.slice(0, -1), operands.slice(0, -1)),
      right: this.visit(operands[operands.length - 1])
    }
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
    }
  }
  
  integerLiteral(ctx: IntegerLiteralCtx) {
    if (ctx.DecimalLiteral) {
      return Number(ctx.DecimalLiteral[0].image);
    }
    return;
  }
  
  parenthesisExpression(ctx: ParenthesisExpressionCtx) {
    return this.visit(ctx.expression);
  }
}

import { Identifier, UnannType } from "../types/classes";
import {
  BaseJavaCstVisitorWithDefaults,
  BlockStatementCstNode,
  IntegralTypeCtx,
  UnannClassTypeCtx,
  VariableDeclaratorIdCtx,
  VariableInitializerCtx,
} from "java-parser";
import {
  BlockStatement,
  Expression,
} from "../types/blocks-and-statements";
import { ExpressionExtractor } from "./expression-extractor";
import { StatementExtractor } from "./statement-extractor";

export class BlockStatementExtractor extends BaseJavaCstVisitorWithDefaults {
  private type: UnannType;
  private identifier: Identifier;
  private value: Expression;

  constructor() {
    super();
  }

  extract(cst: BlockStatementCstNode): BlockStatement {
    this.visit(cst);
    if (cst.children.localVariableDeclarationStatement) {
      return {
        kind: "LocalVariableDeclarationStatement",
        localVariableType: this.type,
        variableDeclaratorList: [
          {
            kind: "VariableDeclarator",
            variableDeclaratorId: this.identifier,
            variableInitializer: this.value,
          },
        ],
      };
    } else /* if (cst.children.statement) */ {
      const statementExtractor = new StatementExtractor();
      return statementExtractor.extract(cst.children.statement![0]);
    }
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
    if (ctx.expression) {
      const expressionExtractor = new ExpressionExtractor()
      this.value = expressionExtractor.extract(ctx.expression[0]);
    }
  }

  unannClassType(ctx: UnannClassTypeCtx) {
    this.type = ctx.Identifier[0].image;
  }
}

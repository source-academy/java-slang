import {
  ArgumentListCtx,
  BaseJavaCstVisitorWithDefaults,
  BinaryExpressionCtx,
  ExpressionCtx,
  FqnOrRefTypeCtx,
  FqnOrRefTypePartCommonCtx,
  FqnOrRefTypePartFirstCtx,
  MethodInvocationSuffixCtx,
  PrimaryCtx,
  PrimaryPrefixCtx,
  PrimarySuffixCtx,
  ReturnStatementCtx,
  StatementCstNode,
  StatementExpressionCtx,
  TernaryExpressionCtx,
  UnaryExpressionCtx,
} from "java-parser";

import {
  Assignment,
  Expression,
  MethodInvocation,
  Statement,
  StatementExpression,
  Void,
} from "../types/blocks-and-statements";
import { ExpressionExtractor } from "./expression-extractor";

export class StatementExtractor extends BaseJavaCstVisitorWithDefaults {
  private stmtExp: StatementExpression;
  private exp: Expression;

  constructor() {
    super();
  }

  extract(cst: StatementCstNode): Statement {
    const statementWithoutTrailingSubstatementCst = cst.children.statementWithoutTrailingSubstatement![0];
    this.visit(statementWithoutTrailingSubstatementCst);
    if (statementWithoutTrailingSubstatementCst.children.expressionStatement) {
      return {
        kind: "ExpressionStatement",
        stmtExp: this.stmtExp,
      };
    } else /* if (statementWithoutTrailingSubstatementCst.children.returnStatement) */ {
      return {
        kind: "ReturnStatement",
        exp: this.exp,
      };
    }
  }

  statementExpression(ctx: StatementExpressionCtx) {
    this.stmtExp = this.visit(ctx.expression);
  }

  returnStatement(ctx: ReturnStatementCtx) {
    if (ctx.expression) {
      const expressionExtractor = new ExpressionExtractor();
      this.exp = expressionExtractor.extract(ctx.expression[0]);
    } else {
      this.exp = {
        kind: "Void",
      } as Void;
    }
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
    // Assignment
    if (ctx.AssignmentOperator && ctx.expression) {
      const expressionExtractor = new ExpressionExtractor();
      return {
        kind: "Assignment",
        left: {
          kind: "ExpressionName",
          name: this.visit(ctx.unaryExpression[0]),
        },
        operator: "=",
        right: expressionExtractor.extract(ctx.expression[0]),
      } as Assignment;
    }
    // MethodInvocation
    return this.visit(ctx.unaryExpression[0]);
  }

  unaryExpression(ctx: UnaryExpressionCtx) {
    // Assignment LHS, MethodInvocation
    return this.visit(ctx.primary);
  }

  primary(ctx: PrimaryCtx) {
    // MethodInvocation
    if (ctx.primarySuffix) {
      return {
        kind: "MethodInvocation",
        identifier: {
          kind: "MethodName",
          name: this.visit(ctx.primaryPrefix),
        },
        argumentList: this.visit(ctx.primarySuffix),
      } as MethodInvocation;
    }
    // Assignment LHS
    return this.visit(ctx.primaryPrefix);
  }

  primaryPrefix(ctx: PrimaryPrefixCtx) {
    // Assignment LHS, MethodInvocation identifier
    if (ctx.fqnOrRefType) {
      return this.visit(ctx.fqnOrRefType);
    }
  }

  primarySuffix(ctx: PrimarySuffixCtx) {
    // MethodInvocation argumentList
    if (ctx.methodInvocationSuffix) {
      return this.visit(ctx.methodInvocationSuffix);
    }
  }

  methodInvocationSuffix(ctx: MethodInvocationSuffixCtx) {
    // MethodInvocation argumentList
    return ctx.argumentList ? this.visit(ctx.argumentList) : [];
  }

  argumentList(ctx: ArgumentListCtx) {
    // MethodInvocation argumentList
    const expressionExtractor = new ExpressionExtractor();
    return ctx.expression.map(e => expressionExtractor.extract(e));
  }

  fqnOrRefType(ctx: FqnOrRefTypeCtx) {
    // Assignment LHS, MethodInvocation identifier
    return this.visit(ctx.fqnOrRefTypePartFirst);
  }

  fqnOrRefTypePartFirst(ctx: FqnOrRefTypePartFirstCtx) {
    // Assignment LHS, MethodInvocation identifier
    return this.visit(ctx.fqnOrRefTypePartCommon);
  }

  fqnOrRefTypePartCommon(ctx: FqnOrRefTypePartCommonCtx) {
    // Assignment LHS, MethodInvocation identifier
    return ctx.Identifier && ctx.Identifier[0].image;
  }
}

import {
  ArgumentListCtx,
  BaseJavaCstVisitorWithDefaults,
  BinaryExpressionCtx,
  ExpressionCtx,
  FqnOrRefTypeCtx,
  FqnOrRefTypePartCommonCtx,
  FqnOrRefTypePartFirstCtx,
  FqnOrRefTypePartRestCtx,
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
    // Assignment LHS, MethodInvocation identifier
    let primary = this.visit(ctx.primaryPrefix);

    if (ctx.primarySuffix) {
      for (const s of ctx.primarySuffix.filter(s => !s.children.methodInvocationSuffix)) {
        primary += "." + this.visit(s);
      }

      // MethodInvocation
      if (ctx.primarySuffix[ctx.primarySuffix.length - 1].children.methodInvocationSuffix) {
        return {
          kind: "MethodInvocation",
          identifier: {
            kind: "MethodName",
            name: primary,
          },
          argumentList: this.visit(ctx.primarySuffix[ctx.primarySuffix.length - 1]),
        } as MethodInvocation;
      }
    }

    return primary;
  }

  primaryPrefix(ctx: PrimaryPrefixCtx) {
    // Assignment LHS, MethodInvocation identifier
    if (ctx.fqnOrRefType) {
      return this.visit(ctx.fqnOrRefType);
    } else if (ctx.This) {
      return ctx.This[0].image;
    }
  }

  primarySuffix(ctx: PrimarySuffixCtx) {
    // MethodInvocation argumentList
    if (ctx.methodInvocationSuffix) {
      return this.visit(ctx.methodInvocationSuffix);
    } else if (ctx.Identifier) {
      return ctx.Identifier[0].image;
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
    let fqn = this.visit(ctx.fqnOrRefTypePartFirst);
    if (ctx.fqnOrRefTypePartRest) {
      for (const r of ctx.fqnOrRefTypePartRest) {
        fqn += "." + this.visit(r);
      }
    }
    return fqn;
  }

  fqnOrRefTypePartFirst(ctx: FqnOrRefTypePartFirstCtx) {
    // Assignment LHS, MethodInvocation identifier
    return this.visit(ctx.fqnOrRefTypePartCommon);
  }

  fqnOrRefTypePartCommon(ctx: FqnOrRefTypePartCommonCtx) {
    // Assignment LHS, MethodInvocation identifier
    return ctx.Identifier && ctx.Identifier[0].image;
  }

  fqnOrRefTypePartRest(ctx: FqnOrRefTypePartRestCtx) {
    return this.visit(ctx.fqnOrRefTypePartCommon);
  }
}

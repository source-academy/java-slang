import {
  ArgumentListCtx,
  BaseJavaCstVisitorWithDefaults,
  BinaryExpressionCtx,
  BlockCtx,
  BlockStatementCtx,
  BlockStatementsCtx,
  ExpressionCtx,
  FqnOrRefTypeCtx,
  FqnOrRefTypePartCommonCtx,
  FqnOrRefTypePartFirstCtx,
  FqnOrRefTypePartRestCtx,
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
} from "java-parser";

import {
  Assignment,
  Expression,
  IfStatement,
  MethodInvocation,
  Statement,
  StatementExpression,
  Void,
} from "../types/blocks-and-statements";
import { ExpressionExtractor } from "./expression-extractor";
import { Location } from "../types/ast";

export class StatementExtractor extends BaseJavaCstVisitorWithDefaults {
  private stmtExp: StatementExpression;
  private exp: Expression;
  private location: Location;

  constructor() {
    super();
  }

  extract(cst: StatementCstNode): Statement {
    if (cst.children.ifStatement) {
      return this.visit(cst.children.ifStatement);
    } else {
      return this.visit(cst.children.statementWithoutTrailingSubstatement!);
    }
  }

  statementWithoutTrailingSubstatement(
    ctx: StatementWithoutTrailingSubstatementCtx
  ): Statement {
    if (ctx.expressionStatement) {
      this.visit(ctx.expressionStatement);
      return {
        kind: "ExpressionStatement",
        stmtExp: this.stmtExp,
        location: this.location,
      };
    } else if (ctx.block) {
      return this.visit(ctx.block);
    } /* if (ctx.returnStatement) */ else {
      this.visit(ctx.returnStatement!);
      return {
        kind: "ReturnStatement",
        exp: this.exp,
        location: this.location,
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
        location: this.location,
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
          location: this.location,
        },
        operator: "=",
        right: expressionExtractor.extract(ctx.expression[0]),
        location: this.location,
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
      for (const s of ctx.primarySuffix.filter(
        (s) => !s.children.methodInvocationSuffix
      )) {
        primary += "." + this.visit(s);
      }

      // MethodInvocation
      if (
        ctx.primarySuffix[ctx.primarySuffix.length - 1].children
          .methodInvocationSuffix
      ) {
        return {
          kind: "MethodInvocation",
          identifier: primary,
          argumentList: this.visit(
            ctx.primarySuffix[ctx.primarySuffix.length - 1]
          ),
          location: this.location,
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
    return ctx.expression.map((e) => expressionExtractor.extract(e));
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

  ifStatement(ctx: IfStatementCtx): IfStatement {
    const consequentStatements: StatementCstNode[] = [];
    const alternateStatements: StatementCstNode[] = [];
    ctx.statement.forEach((statement) => {
      if (!ctx.Else) consequentStatements.push(statement);
      else
        statement.location.startOffset > ctx.Else[0].endOffset
          ? alternateStatements.push(statement)
          : consequentStatements.push(statement);
    });
    const expressionExtractor = new ExpressionExtractor();
    const result: Statement = {
      kind: "IfStatement",
      condition: expressionExtractor.extract(ctx.expression[0]),
      consequent:
        consequentStatements.length > 0
          ? this.extract(consequentStatements[0])
          : { kind: "EmptyStatement" },
    };
    if (alternateStatements.length === 0) return result;
    return { ...result, alternate: this.extract(alternateStatements[0]) };
  }

  block(ctx: BlockCtx): Statement {
    if (ctx.blockStatements) return this.visit(ctx.blockStatements);
    return { kind: "EmptyStatement" };
  }

  blockStatements(ctx: BlockStatementsCtx): Statement {
    return {
      kind: "Block",
      blockStatements: ctx.blockStatement.map((blockStatement) =>
        this.visit(blockStatement)
      ),
    };
  }

  blockStatement(ctx: BlockStatementCtx): Statement {
    if (ctx.statement) return this.extract(ctx.statement[0]);
    return { kind: "EmptyStatement" };
  }
}

import { BlockStatementExtractor } from "./block-statement-extractor";
import { ExpressionExtractor } from "./expression-extractor";
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
  SwitchStatementCtx,
  SwitchBlockCtx,
  SwitchLabelCtx,
  SwitchBlockStatementGroupCtx,
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
  SwitchStatement,
  SwitchCase,
  CaseLabel,
  DefaultLabel,
  Statement,
  StatementExpression,
  VariableDeclarator,
} from "../types/blocks-and-statements";
import { Location } from "../types/ast";
import { TypeExtractor } from "./type-extractor";

export class StatementExtractor extends BaseJavaCstVisitorWithDefaults {
  constructor() {
    super();
  }

  extract(cst: StatementCstNode): Statement {
    if (cst.children.forStatement) {
      return this.visit(cst.children.forStatement);
    } else if (cst.children.ifStatement) {
      return this.visit(cst.children.ifStatement);
    } else if (cst.children.labeledStatement) {
      return this.visit(cst.children.labeledStatement);
    } else if (cst.children.statementWithoutTrailingSubstatement) {
      return this.visit(cst.children.statementWithoutTrailingSubstatement);
    } else if (cst.children.whileStatement) {
      return this.visit(cst.children.whileStatement);
    } else {
      return {
        kind: "EmptyStatement",
      };
    }
  }

  statementWithoutTrailingSubstatement(
    ctx: StatementWithoutTrailingSubstatementCtx
  ) {
    if (ctx.expressionStatement) {
      return this.visit(ctx.expressionStatement);
    } else if (ctx.block) {
      return this.visit(ctx.block);
    } else if (ctx.breakStatement) {
      return { kind: "BreakStatement" };
    } else if (ctx.continueStatement) {
      return { kind: "ContinueStatement" };
    } else if (ctx.switchStatement) {
      return this.visit(ctx.switchStatement);
    } else if (ctx.returnStatement) {
      const returnStatementExp = this.visit(ctx.returnStatement);
      return {
        kind: "ReturnStatement",
        exp: returnStatementExp,
        location: ctx.returnStatement[0].location,
      };
    }
  }

  switchStatement(ctx: SwitchStatementCtx): SwitchStatement {
    const expressionExtractor = new ExpressionExtractor();

    return {
      kind: "SwitchStatement",
      expression: expressionExtractor.extract(ctx.expression[0]),
      cases: ctx.switchBlock
        ? this.visit(ctx.switchBlock)
        : [],
      location: ctx.Switch[0]
    };
  }

  switchBlock(ctx: SwitchBlockCtx): Array<SwitchCase> {
    const cases: Array<SwitchCase> = [];
    let currentCase: SwitchCase;

    ctx.switchBlockStatementGroup?.forEach((group) => {
      const extractedCase = this.visit(group);

      if (!currentCase) {
        // First case in the switch block
        currentCase = extractedCase;
        cases.push(currentCase);
      } else if (currentCase.statements && currentCase.statements.length === 0) {
        // Fallthrough case, merge labels
        currentCase.labels.push(...extractedCase.labels);
      } else {
        // New case with statements starts, push previous case and start new one
        currentCase = extractedCase;
        cases.push(currentCase);
      }
    });

    return cases;
  }

  switchBlockStatementGroup(ctx: SwitchBlockStatementGroupCtx): SwitchCase {
    const blockStatementExtractor = new BlockStatementExtractor();

    console.log(ctx.switchLabel)

    return {
      kind: "SwitchCase",
      labels: ctx.switchLabel.flatMap((label) => this.visit(label)),
      statements: ctx.blockStatements
        ? ctx.blockStatements.flatMap((blockStatements) =>
          blockStatements.children.blockStatement.map((stmt) =>
            blockStatementExtractor.extract(stmt)
          )
        )
        : [],
    };
  }

  // switchLabel(ctx: SwitchLabelCtx): CaseLabel | DefaultLabel {
  //   // Check if the context contains a "case" label
  //   if (ctx.caseOrDefaultLabel?.[0]?.children?.Case) {
  //     const expressionExtractor = new ExpressionExtractor();
  //     // @ts-ignore
  //     const expressionCtx = ctx.caseOrDefaultLabel[0].children.caseLabelElement[0]
  //       .children.caseConstant[0].children.ternaryExpression[0].children;
  //
  //     // Ensure the expression context is valid before proceeding
  //     if (!expressionCtx) {
  //       throw new Error("Invalid Case expression in switch label");
  //     }
  //
  //     const expression = expressionExtractor.ternaryExpression(expressionCtx);
  //
  //     return {
  //       kind: "CaseLabel",
  //       expression: expression,
  //     };
  //   }
  //
  //   // Check if the context contains a "default" label
  //   if (ctx.caseOrDefaultLabel?.[0]?.children?.Default) {
  //     return { kind: "DefaultLabel" };
  //   }
  //
  //   // Throw an error if the context does not match expected patterns
  //   throw new Error("Invalid switch label: Neither 'case' nor 'default' found");
  // }

  switchLabel(ctx: SwitchLabelCtx): Array<CaseLabel | DefaultLabel> {
    const expressionExtractor = new ExpressionExtractor();
    const labels: Array<CaseLabel | DefaultLabel> = [];

    // Process all case or default labels
    for (const labelCtx of ctx.caseOrDefaultLabel) {
      if (labelCtx.children.Case) {
        // Extract the expression for the case label
        const expressionCtx = labelCtx.children.caseLabelElement?.[0]
          ?.children.caseConstant?.[0]?.children.ternaryExpression?.[0]?.children;

        if (!expressionCtx) {
          throw new Error("Invalid Case expression in switch label");
        }

        labels.push({
          kind: "CaseLabel",
          expression: expressionExtractor.ternaryExpression(expressionCtx),
        });
      } else if (labelCtx.children.Default) {
        labels.push({ kind: "DefaultLabel" });
      }
    }

    if (labels.length === 0) {
      throw new Error("Invalid switch label: Neither 'case' nor 'default' found");
    }

    return labels;
  }

  expressionStatement(ctx: ExpressionStatementCtx): ExpressionStatement {
    const stmtExp = this.visit(ctx.statementExpression);
    return {
      kind: "ExpressionStatement",
      stmtExp,
      location: stmtExp.location,
    };
  }

  statementExpression(ctx: StatementExpressionCtx) {
    return this.visit(ctx.expression);
  }

  returnStatement(ctx: ReturnStatementCtx) {
    if (ctx.expression) {
      const expressionExtractor = new ExpressionExtractor();
      return expressionExtractor.extract(ctx.expression[0]);
    }
    return { kind: "Void" };
  }

  expression(ctx: ExpressionCtx) {
    if (ctx.lambdaExpression) {
      throw new Error("Unimplemented extractor.");
    } else if (ctx.ternaryExpression) {
      return this.visit(ctx.ternaryExpression);
    }
  }

  ternaryExpression(ctx: TernaryExpressionCtx) {
    if (
      ctx.binaryExpression &&
      ctx.QuestionMark &&
      ctx.Colon &&
      ctx.expression
    ) {
      const expressionExtractor = new ExpressionExtractor();
      return expressionExtractor.ternaryExpression(ctx);
    }
    return this.visit(ctx.binaryExpression);
  }

  binaryExpression(ctx: BinaryExpressionCtx) {
    // Assignment
    if (ctx.AssignmentOperator && ctx.expression) {
      const expressionExtractor = new ExpressionExtractor();
      const left = this.visit(ctx.unaryExpression[0]);
      return {
        kind: "Assignment",
        left,
        operator: "=",
        right: expressionExtractor.extract(ctx.expression[0]),
        location: left.location,
      };
    }
    // MethodInvocation
    return this.visit(ctx.unaryExpression[0]);
  }

  unaryExpression(ctx: UnaryExpressionCtx) {
    if (ctx.UnaryPrefixOperator || ctx.UnarySuffixOperator) {
      const expressionExtractor = new ExpressionExtractor();
      return expressionExtractor.unaryExpression(ctx);
    }
    // Assignment LHS, MethodInvocation
    return this.visit(ctx.primary);
  }

  primary(ctx: PrimaryCtx) {
    // Assignment LHS, MethodInvocation identifier
    let { name, location } = this.visit(ctx.primaryPrefix);
    if (ctx.primarySuffix) {
      for (const s of ctx.primarySuffix.filter(
        (s) => !s.children.methodInvocationSuffix
      )) {
        name += "." + this.visit(s);
      }

      // MethodInvocation
      if (
        ctx.primarySuffix[ctx.primarySuffix.length - 1].children
          .methodInvocationSuffix
      ) {
        return {
          kind: "MethodInvocation",
          identifier: name,
          argumentList: this.visit(
            ctx.primarySuffix[ctx.primarySuffix.length - 1]
          ),
          location,
        } as MethodInvocation;
      }
    }
    return {
      kind: "ExpressionName",
      name,
      location,
    };
  }

  primaryPrefix(ctx: PrimaryPrefixCtx): { name: string; location: Location } {
    // Assignment LHS, MethodInvocation identifier
    if (ctx.fqnOrRefType) {
      return this.visit(ctx.fqnOrRefType);
    } else if (ctx.This) {
      const thisKeyword = ctx.This[0];
      return {
        name: thisKeyword.image,
        location: {
          startOffset: thisKeyword.startOffset,
          startLine: thisKeyword.startLine,
          startColumn: thisKeyword.startColumn,
          endOffset: thisKeyword.endOffset,
          endLine: thisKeyword.endLine,
          endColumn: thisKeyword.endColumn,
        } as Location,
      };
    }
    throw new Error("Unimplemeted extractor.");
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
    let { name, location } = this.visit(ctx.fqnOrRefTypePartFirst);
    if (ctx.fqnOrRefTypePartRest) {
      for (const r of ctx.fqnOrRefTypePartRest) {
        name += "." + this.visit(r).name;
      }
    }
    return { name, location };
  }

  fqnOrRefTypePartFirst(ctx: FqnOrRefTypePartFirstCtx) {
    // Assignment LHS, MethodInvocation identifier
    return this.visit(ctx.fqnOrRefTypePartCommon);
  }

  fqnOrRefTypePartCommon(ctx: FqnOrRefTypePartCommonCtx) {
    // Assignment LHS, MethodInvocation identifier
    if (ctx.Identifier) {
      const identifier = ctx.Identifier[0];
      return {
        name: identifier.image,
        location: {
          startOffset: identifier.startOffset,
          startLine: identifier.startLine,
          startColumn: identifier.startColumn,
          endOffset: identifier.endOffset,
          endLine: identifier.endLine,
          endColumn: identifier.endColumn,
        } as Location,
      };
    }
    throw new Error("Unimplemented extractor.");
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
      blockStatements: ctx.blockStatement.map((blockStatement) => {
        const blockStatementExtrator = new BlockStatementExtractor();
        return blockStatementExtrator.extract(blockStatement);
      }),
    };
  }

  whileStatement(ctx: WhileStatementCtx) {
    const expressionExtractor = new ExpressionExtractor();
    const statementExtractor = new StatementExtractor();
    return {
      kind: "WhileStatement",
      condition: expressionExtractor.extract(ctx.expression[0]),
      body: statementExtractor.extract(ctx.statement[0]),
    };
  }

  forStatement(ctx: ForStatementCtx) {
    if (ctx.basicForStatement) {
      return this.visit(ctx.basicForStatement);
    } else if (ctx.enhancedForStatement) {
      return this.visit(ctx.enhancedForStatement);
    }
  }

  basicForStatement(ctx: BasicForStatementCtx): BasicForStatement {
    const expressionExtractor = new ExpressionExtractor();
    const statementExtractor = new StatementExtractor();
    return {
      kind: "BasicForStatement",
      forInit: ctx.forInit ? this.visit(ctx.forInit) : [],
      condition: expressionExtractor.extract(ctx.expression![0]),
      forUpdate: ctx.forUpdate ? this.visit(ctx.forUpdate) : [],
      body: statementExtractor.extract(ctx.statement[0]),
    };
  }

  forInit(ctx: ForInitCtx) {
    if (ctx.localVariableDeclaration) {
      return this.visit(ctx.localVariableDeclaration);
    } else if (ctx.statementExpressionList) {
      return this.visit(ctx.statementExpressionList);
    }
  }

  localVariableDeclaration(ctx: LocalVariableDeclarationCtx) {
    return {
      kind: "LocalVariableDeclarationStatement",
      localVariableType: this.visit(ctx.localVariableType),
      variableDeclaratorList: this.visit(ctx.variableDeclaratorList),
    };
  }

  forUpdate(ctx: ForUpdateCtx) {
    return this.visit(ctx.statementExpressionList);
  }

  statementExpressionList(ctx: StatementExpressionListCtx) {
    const result: Array<StatementExpression> = [];
    ctx.statementExpression.forEach((stmtExp) => {
      result.push(this.visit(stmtExp));
    });
    return result;
  }

  localVariableType(ctx: LocalVariableTypeCtx) {
    const typeExtractor = new TypeExtractor();
    if (ctx.unannType) {
      return typeExtractor.extract(ctx.unannType[0]);
    }
    throw new Error("Unimplemented extractor.");
  }

  variableDeclaratorList(ctx: VariableDeclaratorListCtx) {
    return ctx.variableDeclarator
      .map((variableDeclarator) => this.visit(variableDeclarator))
      .flat();
  }

  variableDeclarator(ctx: VariableDeclaratorCtx) {
    const declarations: VariableDeclarator[] = [];
    ctx.variableDeclaratorId.forEach((variable, index) => {
      const expressionExtractor = new ExpressionExtractor();
      declarations.push({
        kind: "VariableDeclarator",
        variableDeclaratorId: variable.children.Identifier[0].image,
        variableInitializer: expressionExtractor.extract(
          ctx.variableInitializer![index].children.expression![0]
        ),
      });
    });
    return declarations;
  }
}

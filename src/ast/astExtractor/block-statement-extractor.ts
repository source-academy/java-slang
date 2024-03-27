import { ExpressionExtractor } from "./expression-extractor";
import { Identifier, UnannType } from "../types/classes";
import { StatementExtractor } from "./statement-extractor";
import { TypeExtractor } from "./type-extractor";
import {
  BaseJavaCstVisitorWithDefaults,
  BlockStatementCstNode,
  LocalVariableTypeCtx,
  VariableDeclaratorIdCtx,
  VariableInitializerCtx,
} from "java-parser";
import {
  BlockStatement,
  Expression,
  VariableDeclarator,
} from "../types/blocks-and-statements";

export class BlockStatementExtractor extends BaseJavaCstVisitorWithDefaults {
  private type: UnannType;
  private identifier: Identifier[] = [];
  private value: Expression[] = [];

  extract(cst: BlockStatementCstNode): BlockStatement {
    this.visit(cst);
    if (cst.children.localVariableDeclarationStatement) {
      const variableDeclaratorList = this.identifier.map(
        (identifier, index): VariableDeclarator => ({
          kind: "VariableDeclarator",
          variableDeclaratorId: identifier,
          variableInitializer: this.value[index],
        })
      );
      return {
        kind: "LocalVariableDeclarationStatement",
        localVariableType: this.type,
        variableDeclaratorList,
        location: cst.location,
      };
    } /* if (cst.children.statement) */ else {
      const statementExtractor = new StatementExtractor();
      return statementExtractor.extract(cst.children.statement![0]);
    }
  }

  localVariableType(ctx: LocalVariableTypeCtx) {
    const typeExtractor = new TypeExtractor();
    if (ctx.unannType) {
      this.type = typeExtractor.extract(ctx.unannType[0]);
    }
  }

  variableDeclaratorId(ctx: VariableDeclaratorIdCtx) {
    this.identifier.push(ctx.Identifier[0].image);
  }

  variableInitializer(ctx: VariableInitializerCtx) {
    if (ctx.expression) {
      const expressionExtractor = new ExpressionExtractor();
      ctx.expression.forEach((expression) => {
        this.value.push(expressionExtractor.extract(expression));
      });
    }
  }
}

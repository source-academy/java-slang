import {
  BaseJavaCstVisitorWithDefaults,
  BlockStatementCstNode,
  LocalVariableTypeCtx,
  VariableDeclaratorIdCtx,
  VariableInitializerCtx,
} from "java-parser";

import { BlockStatement, Expression } from "../types/blocks-and-statements";
import { Identifier, UnannType } from "../types/classes";
import { ExpressionExtractor } from "./expression-extractor";
import { StatementExtractor } from "./statement-extractor";
import { TypeExtractor } from "./type-extractor";

export class BlockStatementExtractor extends BaseJavaCstVisitorWithDefaults {
  private type: UnannType;
  private identifier: Identifier;
  private value: Expression;

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
        location: cst.location,
      };
    } else /* if (cst.children.statement) */ {
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
    this.identifier = ctx.Identifier[0].image;
  }

  variableInitializer(ctx: VariableInitializerCtx) {
    if (ctx.expression) {
      const expressionExtractor = new ExpressionExtractor()
      this.value = expressionExtractor.extract(ctx.expression[0]);
    }
  }
}

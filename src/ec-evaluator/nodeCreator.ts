import {
  Assignment,
  Expression,
  LeftHandSide,
  LocalVariableDeclarationStatement,
  VariableDeclarator,
  VariableDeclaratorId,
} from "../ast/types/blocks-and-statements";
import { UnannType } from "../ast/types/classes";

export const localVarDeclNoInitNode = (
  localVariableType: UnannType,
  variableDeclaratorId: VariableDeclaratorId,
): LocalVariableDeclarationStatement => ({
  kind: "LocalVariableDeclarationStatement",
  localVariableType,
  variableDeclaratorList: [
    {
      kind: "VariableDeclarator",
      variableDeclaratorId,
    } as VariableDeclarator,
  ],
});

export const assmtNode = (
  left: string,
  right: Expression,
  operator: string = '=',
): Assignment => ({
  kind: "Assignment",
  left: {
    kind: "ExpressionName",
    name: left,
  } as LeftHandSide,
  operator,
  right,
});

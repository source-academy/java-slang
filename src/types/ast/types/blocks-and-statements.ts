import { Identifier, UnannType } from './classes'
import { BaseNode, Location } from '.'

export type BlocksAndStatementsNode = BlockStatement | Primary | StatementExpression | Expression

// ====

export type ArgumentList = Array<Expression>

export interface ArrayAccess extends BaseNode {
  kind: 'ArrayAccess'
  primary: Primary
  expression: Expression
}

export interface ArrayCreationExpression extends BaseNode {
  kind: 'ArrayCreationExpression'
  type: string
  dimensionExpressions?: DimensionExpression[] // Undefined if arrayInitializer - new int[5]
  arrayInitializer?: ArrayInitializer // Undefined if dimensionExpressions - new int[]{ 1,2,3 }
  location?: Location
}

export type ArrayInitializer = Array<VariableInitializer>

export interface BasicForStatement extends BaseNode {
  kind: 'BasicForStatement'
  forInit: Array<ExpressionStatement> | LocalVariableDeclarationStatement
  condition?: Expression
  forUpdate: Array<ExpressionStatement>
  body: Statement
}

export interface Block extends BaseNode {
  kind: 'Block'
  blockStatements: Array<BlockStatement>
}

export type BlockStatement =
  | ExplicitConstructorInvocation
  | LocalVariableDeclarationStatement
  | Statement

export interface ClassInstanceCreationExpression extends BaseNode {
  kind: 'ClassInstanceCreationExpression'
  identifier: Identifier
  argumentList: ArgumentList
}

export interface DimensionExpression extends BaseNode {
  kind: 'DimensionExpression'
  expression: Expression
  location?: Location
}

export interface DoStatement extends BaseNode {
  kind: 'DoStatement'
  condition: Expression
  body: Statement
}

export interface EmptyStatement extends BaseNode {
  kind: 'EmptyStatement'
}

export interface EnhancedForStatement extends BaseNode {
  kind: 'EnhancedForStatement'
  localVariableType: LocalVariableType
  variableDeclaratorId: VariableDeclaratorId
  expression: Expression
  statement: Statement
  location?: Location
}

export interface ExplicitConstructorInvocation extends BaseNode {
  kind: 'ExplicitConstructorInvocation'
  thisOrSuper: 'this' | 'super'
  argumentList: ArgumentList
}

export type Expression = BinaryExpression | TernaryExpression | UnaryExpression | Void

export interface ExpressionStatement extends BaseNode {
  kind: 'ExpressionStatement'
  stmtExp: StatementExpression
}

export interface FieldAccess extends BaseNode {
  kind: 'FieldAccess'
  primary: Primary
  identifier: Identifier
}

export type ForStatement = BasicForStatement | EnhancedForStatement

export interface IfStatement extends BaseNode {
  kind: 'IfStatement'
  condition: Expression
  consequent: Statement
  alternate?: Statement
}

export interface Literal extends BaseNode {
  kind: 'Literal'
  literalType:
    | IntegerLiteral
    | FloatingPointLiteral
    | BooleanLiteral
    | CharacterLiteral
    | TextBlockLiteral
    | NullLiteral
}

export interface LocalVariableDeclarationStatement extends BaseNode {
  kind: 'LocalVariableDeclarationStatement'
  localVariableType: LocalVariableType
  variableDeclaratorList: Array<VariableDeclarator>
}

export type LocalVariableType = UnannType

export interface MethodInvocation extends BaseNode {
  kind: 'MethodInvocation'
  identifier: Identifier
  argumentList: ArgumentList
  primary?: Primary
}

export type Primary = ArrayCreationExpression | PrimaryNoNewArray

export type PrimaryNoNewArray =
  | ArrayAccess
  | ClassInstanceCreationExpression
  // | ClassLiteral
  | ExpressionName
  | FieldAccess
  | Literal
  // | ParenthesisExpression
  | MethodInvocation
  // | MethodReference
  | This
// | TypeName

export interface ReturnStatement extends BaseNode {
  kind: 'ReturnStatement'
  exp: Expression
}

export type Statement =
  | ForStatement
  | IfStatement
  // | LabeledStatement
  | StatementWithoutTrailingSubstatement
  | WhileStatement

export type StatementExpression = MethodInvocation | Assignment

export type StatementWithoutTrailingSubstatement =
  // | AssertStatement
  | Block
  | BreakStatement
  | ContinueStatement
  | DoStatement
  | EmptyStatement
  | ExpressionStatement
  | ReturnStatement
// | ThrowStatement
// | TryStatement
// | SwitchStatement
// | SynchronizedStatement
// | YieldStatement

export interface VariableDeclarator {
  kind: 'VariableDeclarator'
  variableDeclaratorId: VariableDeclaratorId
  dims?: string
  variableInitializer?: VariableInitializer
  location?: Location
}

export type VariableDeclaratorId = Identifier

export type VariableInitializer = Expression | ArrayInitializer

export interface Void extends BaseNode {
  kind: 'Void'
}

export interface WhileStatement extends BaseNode {
  kind: 'WhileStatement'
  condition: Expression
  body: Statement
}

// ===== UNSORTED =====

export type IntegerLiteral =
  | DecimalIntegerLiteral
  | HexIntegerLiteral
  | OctalIntegerLiteral
  | BinaryIntegerLiteral

export interface DecimalIntegerLiteral {
  kind: 'DecimalIntegerLiteral'
  value: string
}
export interface HexIntegerLiteral {
  kind: 'HexIntegerLiteral'
  value: string
}
export interface OctalIntegerLiteral {
  kind: 'OctalIntegerLiteral'
  value: string
}
export interface BinaryIntegerLiteral {
  kind: 'BinaryIntegerLiteral'
  value: string
}

export type FloatingPointLiteral = DecimalFloatingPointLiteral | HexadecimalFloatingPointLiteral
export interface DecimalFloatingPointLiteral {
  kind: 'DecimalFloatingPointLiteral'
  value: string
}
export interface HexadecimalFloatingPointLiteral {
  kind: 'HexadecimalFloatingPointLiteral'
  value: string
}

export interface BooleanLiteral {
  kind: 'BooleanLiteral'
  value: 'true' | 'false'
}

export interface CharacterLiteral {
  kind: 'CharacterLiteral'
  value: string
}

export type TextBlockLiteral = StringLiteral
export interface StringLiteral {
  kind: 'StringLiteral'
  value: string
}

export interface NullLiteral {
  kind: 'NullLiteral'
  value: 'null'
}

export type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '|'
  | '&'
  | '^'
  | '<<'
  | '>>'
  | '>>>'
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | '&&'
  | '||'
export interface BinaryExpression extends BaseNode {
  kind: 'BinaryExpression'
  operator: BinaryOperator
  left: Expression
  right: Expression
}

export interface ExpressionName extends BaseNode {
  kind: 'ExpressionName'
  name: string
}

export interface Assignment extends BaseNode {
  kind: 'Assignment'
  left: LeftHandSide
  operator: '=' | '+=' | '-=' | '*=' | '/=' | '%=' | '|=' | '&=' | '^=' | '<<=' | '>>=' | '>>>='
  right: Expression
}

export type LeftHandSide = ExpressionName | ArrayAccess
export type UnaryExpression =
  // | CastExpression
  PrefixExpression | Primary | PostfixExpression
// | SwitchExpression

export interface PrefixExpression extends BaseNode {
  kind: 'PrefixExpression'
  operator: '-' | '+' | '++' | '--' | '!' | '~'
  expression: UnaryExpression
}

export interface PostfixExpression extends BaseNode {
  kind: 'PostfixExpression'
  operator: '++' | '--'
  expression: Expression
}

export interface BreakStatement extends BaseNode {
  kind: 'BreakStatement'
  identifier?: Identifier
}

export interface ContinueStatement extends BaseNode {
  kind: 'ContinueStatement'
  identifier?: Identifier
}

export interface TernaryExpression extends BaseNode {
  kind: 'TernaryExpression'
  condition: Expression
  consequent: Expression
  alternate: Expression
}

export interface This extends BaseNode {
  kind: 'This'
}

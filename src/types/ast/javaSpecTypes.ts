/* eslint-disable @typescript-eslint/no-duplicate-type-constituents */

// TODO: Refactor BinaryExpression
// TODO: Refactor Literals
// TODO: Refactor modifiers
// TODO: Implement types for switch rules
// TODO: Implement types for annotation
// TODO: Implement types for packages and modules

export type Node = Expression | Statement

export type Location = {
  startOffset: number
  startLine: number
  startColumn?: number
  endOffset?: number
  endLine?: number
  endColumn?: number
}

export type ArgumentList = {
  kind: 'ArgumentList'
  expressions: Array<Expression>
  location: Location
}

export type ArrayAccess = {
  kind: 'ArrayAccess'
  primary: Primary
  expression: Expression
  location: Location
}

export type ArrayCreationExpression =
  | ArrayCreationExpressionWithInitializer
  | ArrayCreationExpressionWithoutInitializer

export type ArrayCreationExpressionWithInitializer = {
  kind: 'ArrayCreationExpressionWithInitializer'
  classOrInterfaceType?: ClassOrInterfaceType
  primitiveType?: PrimitiveType
  dims: Dims
  arrayInitializer: ArrayInitializer
  location: Location
}

export type ArrayCreationExpressionWithoutInitializer = {
  kind: 'ArrayCreationExpressionWithoutInitializer'
  classOrInterfaceType?: ClassOrInterfaceType
  primitiveType?: PrimitiveType
  dimExprs: DimExprs
  dims: Dims
  location: Location
}

export type ArrayInitializer = {
  kind: 'ArrayInitializer'
  variableInitializerList: Array<VariableInitializer>
  location: Location
}

export type ArrayType = {
  kind: 'ArrayType'
  primitiveType?: PrimitiveType
  classOrInterfaceType?: ClassOrInterfaceType
  typeVariable?: TypeVariable
  dims: Dims
}

export type AssertStatement = {
  kind: 'AssertStatement'
  expression1: Expression
  expression2?: Expression
  location: Location
}

export type Assignment = {
  kind: 'Assignment'
  leftHandSide: Expression
  assignmentOperator: Identifier
  rightHandSide: Expression
  location: Location
}

export type AssignmentExpression = ConditionalExpression | Assignment

export type BasicForStatement = {
  kind: 'BasicForStatement'
  forInit?: ForInit
  expression?: Expression
  forUpdate?: ForUpdate
  statement: Statement
  location: Location
}

export type BasicForStatementNoShortIf = {
  kind: 'BasicForStatementNoShortIf'
  forInit?: ForInit
  expression?: Expression
  forUpdate?: ForUpdate
  statementNoShortIf: StatementNoShortIf
  location: Location
}

export type BinaryExpression =
  | UnaryExpression
  | {
      kind: 'BinaryExpression'
      leftHandSide: Expression
      binaryOperator: Identifier
      rightHandSide: Expression
      location: Location
    }

export type BinaryLiteral = {
  kind: 'BinaryLiteral'
  identifier: Identifier
  location: Location
}

export type Block = {
  kind: 'Block'
  blockStatements?: BlockStatements
  location: Location
}

export type BlockStatement =
  | LocalClassOrInterfaceDeclaration
  | LocalVariableDeclarationStatement
  | Statement

export type BlockStatements = {
  kind: 'BlockStatements'
  blockStatements: BlockStatement[]
  location: Location
}

export type Boolean = {
  kind: 'Boolean'
  location: Location
}

export type BooleanLiteral = {
  kind: 'BooleanLiteral'
  identifier: Identifier
  location: Location
}

export type BreakStatement = {
  kind: 'BreakStatement'
  identifier?: Identifier
  location: Location
}

export type CaseConstant = ConditionalExpression

export type CasePattern = Pattern

export type CastExpression =
  | {
      kind: 'CastExpression'
      primitiveType: PrimitiveType
      unaryExpression: UnaryExpression
      location: Location
    }
  | {
      kind: 'CastExpression'
      referenceType: ReferenceType
      unaryExpressionNotPlusMinus: UnaryExpressionNotPlusMinus
      location: Location
    }
  | {
      kind: 'CastExpression'
      referenceType: ReferenceType
      lambdaExpression: LambdaExpression
      location: Location
    }

export type CatchClause = {
  kind: 'CatchClause'
  catchFormalParameter: CatchFormalParameter
  block: Block
  location: Location
}

export type Catches = {
  kind: 'Catches'
  catchClauses: CatchClause[]
  location: Location
}

export type CatchFormalParameter = {
  kind: 'CatchFormalParameter'
  variableModifiers: VariableModifier[]
  catchType: CatchType
  variableDeclaratorId: VariableDeclaratorId
  location: Location
}

export type CatchType = {
  kind: 'CatchType'
  unannClassType: UnannClassType
  classTypes?: ClassType[]
  location: Location
}

export type CharacterLiteral = {
  kind: 'CharacterLiteral'
  identifier: Identifier
  location: Location
}

export type ClassBody = {
  kind: 'ClassBody'
  classBodyDeclarations: ClassBodyDeclaration[]
  location: Location
}

export type ClassBodyDeclaration = ClassMemberDeclaration

export type ClassDeclaration = NormalClassDeclaration | EnumDeclaration | RecordDeclaration

export type ClassExtends = {
  kind: 'ClassExtends'
  classType: ClassType
  location: Location
}

export type ClassImplements = {
  kind: 'ClassImplements'
  interfaceTypeList: InterfaceType[]
  location: Location
}

export type ClassInstanceCreationExpression =
  | UnqualifiedClassInstanceCreationExpression
  | {
      kind: 'ClassInstanceCreationExpression'
      expressionName?: ExpressionName
      primary?: Primary
      unqualifiedClassInstanceCreationExpression: UnqualifiedClassInstanceCreationExpression
      location: Location
    }

export type ClassLiteral = {
  kind: 'ClassLiteral'
  type: Identifier
  dims: Dims
  location: Location
}

export type ClassMemberDeclaration = FieldDeclaration | MethodDeclaration | ClassDeclaration

export type ClassModifier = Identifier

export type ClassOrInterfaceType = ClassType | InterfaceType

export type ClassOrInterfaceTypeToInstantiate = {
  kind: 'ClassOrInterfaceTypeToInstantiate'
  identifiers: Identifier[]
  location: Location
}

export type ClassPermits = {
  kind: 'ClassPermits'
  typeNames: TypeName[]
  location: Location
}

export type ClassType = {
  kind: 'ClassType'
  classOrInterfaceType: ClassOrInterfaceType
  typeIdentifier: TypeIdentifier
  location: Location
}

export type ConditionalExpression =
  | BinaryExpression
  | {
      kind: 'ConditionalExpression'
      conditionalExpression: Expression
      consequentExpression: Expression
      alternateExpression: Expression
      location: Location
    }

export type ConstantDeclaration = {
  kind: 'ConstantDeclaration'
  constantModifiers: ConstantModifier[]
  unannType: UnannType
  variableDeclaratorList: VariableDeclaratorList
  location: Location
}

export type ConstantModifier = Identifier

export type ConstructorBody = {
  kind: 'ConstructorBody'
  explicitConstructorInvocation?: ExplicitConstructorInvocation
  blockStatements?: BlockStatements
  location: Location
}

export type ConstructorModifier = Identifier

export type ContinueStatement = {
  kind: 'ContinueStatement'
  identifier?: Identifier
  location: Location
}

export type CompactConstructorDeclaration = {
  kind: 'CompactConstructorDeclaration'
  constructorModifiers: ConstructorModifier[]
  simpleTypeName: SimpleTypeName
  constructorBody: ConstructorBody
  location: Location
}

export type ComponentPattern = Pattern | MatchAllPattern

export type ComponentPatternList = {
  kind: 'ComponentPatternList'
  componentPatterns: ComponentPattern[]
  location: Location
}

export type DecimalFloatingPointLiteral = {
  kind: 'DecimalFloatingPointLiteral'
  identifier: Identifier
  location: Location
}

export type DecimalLiteral = {
  kind: 'DecimalLiteral'
  identifier: Identifier
  location: Location
}

export type Default = {
  kind: 'Default'
  location: Location
}

export type DimExpr = {
  kind: 'DimExpr'
  expression: Expression
  location: Location
}

export type DimExprs = {
  kind: 'DimExprs'
  dimExprs: DimExpr[]
  location: Location
}

export type Dim = {
  kind: 'Dim'
  location: Location
}

export type Dims = {
  kind: 'Dims'
  dims: Dim[]
  location: Location
}

export type DoStatement = {
  kind: 'DoStatement'
  statement: Statement
  expression: Expression
  location: Location
}

export type EnhancedForStatement = {
  kind: 'EnhancedForStatement'
  localVariableDeclaration: LocalVariableDeclaration
  expression: Expression
  statement: Statement
  location: Location
}

export type EnhancedForStatementNoShortIf = {
  kind: 'EnhancedForStatementNoShortIf'
  localVariableDeclaration: LocalVariableDeclaration
  expression: Expression
  statementNoShortIf: StatementNoShortIf
  location: Location
}

export type EnumBody = {
  kind: 'EnumBody'
  enumConstantList: EnumConstantList
  enumBodyDeclarations: EnumBodyDeclarations
}

export type EnumBodyDeclarations = {
  kind: 'EnumBodyDeclarations'
  classBodyDeclaration: ClassBodyDeclaration[]
  location: Location
}

export type EnumConstant = {
  kind: 'EnumConstant'
  enumConstantModifiers: EnumConstantModifier[]
  identifier: Identifier
  argumentList?: ArgumentList
  classBody?: ClassBody
}

export type EnumConstantList = {
  kind: 'EnumConstantList'
  enumConstants: EnumConstant[]
  location: Location
}

export type EnumConstantModifier = {}

export type EnumDeclaration = {
  kind: 'EnumDeclaration'
  classModifiers: ClassModifier[]
  typeIdentifier: TypeIdentifier
  classImplements?: ClassImplements
  enumBody: EnumBody
}

export type EmptyStatement = {
  kind: 'EmptyStatement'
  location: Location
}

export type ExceptionType = ClassType | TypeVariable

export type ExplicitConstructorInvocation = {
  kind: 'ExplicitConstructorInvocation'
  expressionName?: ExpressionName
  primary?: Primary
  this?: This
  super?: Super
  argumentList?: ArgumentList
  location: Location
}

export type Expression = LambdaExpression | AssignmentExpression

export type ExpressionName = {
  kind: 'ExpressionName'
  identifier: Identifier
  location: Location
}

export type ExpressionStatement = StatementExpression

export type FieldDeclaration = {
  kind: 'FieldDeclaration'
  fieldModifiers: FieldModifier[]
  unannType: UnannType
  variableDeclaratorList: VariableDeclaratorList
  location: Location
}

export type FieldModifier = Identifier

export type Finally = {
  kind: 'Finally'
  block: Block
  location: Location
}

export type FloatingPointLiteral = DecimalFloatingPointLiteral | HexadecimalFloatingPointLiteral

export type FloatingPointType = {
  kind: 'FloatingPointType'
  identifier: Identifier
  location: Location
}

export type ForInit = StatementExpressionList | LocalVariableDeclaration

export type FormalParameter =
  | VariableArityParameter
  | {
      kind: 'FormalParameter'
      variableModifiers: VariableModifier[]
      unannType: UnannType
      variableDeclaratorId: VariableDeclaratorId
      location: Location
    }

export type ForStatement = BasicForStatement | EnhancedForStatement

export type ForStatementNoShortIf = BasicForStatementNoShortIf | EnhancedForStatementNoShortIf

export type ForUpdate = StatementExpressionList

export type Guard = {
  kind: 'Guard'
  expression: Expression
  location: Location
}

export type HexadecimalFloatingPointLiteral = {
  kind: 'HexadecimalFloatingPointLiteral'
  identifier: Identifier
  location: Location
}

export type HexLiteral = {
  kind: 'HexLiteral'
  identifier: Identifier
  location: Location
}

export type Identifier = {
  kind: 'Identifier'
  identifier: string
  location: Location
}

export type IfThenElseStatement = {
  kind: 'IfThenElseStatement'
  expression: Expression
  statementNoShortIf: StatementNoShortIf
  statement: Statement
  location: Location
}

export type IfThenElseStatementNoShortIf = {
  kind: 'IfThenElseStatementNoShortIf'
  expression: Expression
  statementNoShortIf: StatementNoShortIf
  statementNoShortIfElse: StatementNoShortIf
  location: Location
}

export type IfThenStatement = {
  kind: 'IfThenStatement'
  expression: Expression
  statement: Statement
  location: Location
}

export type IntegerLiteral = BinaryLiteral | DecimalLiteral | HexLiteral | OctalLiteral

export type IntegralType = {
  kind: 'IntegralType'
  identifier: Identifier
  location: Location
}

export type InterfaceBody = {
  kind: 'InterfaceBody'
  interfaceMemberDeclarations: InterfaceMemberDeclaration[]
  location: Location
}

export type InterfaceDeclaration = NormalInterfaceDeclaration

export type InterfaceExtends = {
  kind: 'InterfaceExtends'
  interfaceTypeList: InterfaceTypeList
  location: Location
}

export type InterfaceMemberDeclaration =
  | ConstantDeclaration
  | InterfaceMethodDeclaration
  | ClassDeclaration
  | InterfaceDeclaration

export type InterfaceMethodDeclaration = {
  kind: 'InterfaceMethodDeclaration'
  interfaceMethodModifier: InterfaceMethodModifier[]
  methodHeader: MethodHeader
  methodBody: MethodBody
  location: Location
}

export type InterfaceMethodModifier = Identifier

export type InterfaceModifier = Identifier

export type InterfacePermits = {
  kind: 'InterfacePermits'
  typeNames: TypeName[]
  location: Location
}

export type InterfaceType = ClassType

export type InterfaceTypeList = {
  kind: 'InterfaceTypeList'
  interfaceTypes: InterfaceType[]
  location: Location
}

export type LabeledStatement = {
  kind: 'LabeledStatement'
  identifier: Identifier
  statement: Statement
  location: Location
}

export type LabeledStatementNoShortIf = {
  kind: 'LabeledStatementNoShortIf'
  identifier: Identifier
  statementNoShortIf: StatementNoShortIf
  location: Location
}

export type LambdaExpression = {}

export type Literal =
  | IntegerLiteral
  | FloatingPointLiteral
  | BooleanLiteral
  | CharacterLiteral
  | StringLiteral
  | NullLiteral

export type LocalClassOrInterfaceDeclaration = ClassDeclaration | NormalInterfaceDeclaration

export type LocalVariableDeclaration = {
  kind: 'LocalVariableDeclaration'
  variableModifiers: VariableModifier[]
  localVariableType: LocalVariableType
  variableDeclaratorList: VariableDeclaratorList
  location: Location
}

export type LocalVariableDeclarationStatement = LocalVariableDeclaration

export type LocalVariableType = UnannType | Var

export type MatchAllPattern = {
  kind: 'MatchAllPattern'
  location: Location
}

export type MethodBody = {
  kind: 'MethodBody'
}

export type MethodDeclaration = {
  kind: 'MethodDeclaration'
  methodModifiers: MethodModifier[]
  methodHeader: MethodHeader
  methodBody: MethodBody
}

export type MethodDeclarator = {
  kind: 'MethodDeclarator'
  identifier: Identifier
  receiverParameter?: ReceiverParameter
  formalParameterList: FormalParameter[]
  dims: Dims
  location: Location
}

export type MethodHeader = {
  kind: 'MethodHeader'
  result: Result
  methodDeclarator: MethodDeclarator
  throws: Throws
}

export type MethodInvocation = {
  kind: 'MethodInvocation'
  methodName?: MethodName
  typeName?: TypeName
  expressionName?: ExpressionName
  primary?: Primary
  super?: Super
  identifier?: Identifier
  argumentList?: ArgumentList
  location: Location
}

export type MethodModifier = Identifier

export type MethodName = UnqualifiedMethodIdentifier

export type NormalClassDeclaration = {
  kind: 'NormalClassDeclaration'
  classModifiers: ClassModifier[]
  typeIdentifier: TypeIdentifier
  classExtends?: ClassExtends
  classImplements?: ClassImplements
  classPermits?: ClassPermits
  classBody: ClassBody
  location: Location
}

export type NormalInterfaceDeclaration = {
  kind: 'NormalInterfaceDeclaration'
  interfaceModifiers: InterfaceModifier[]
  typeIdentifier: TypeIdentifier
  interfaceExtends?: InterfaceExtends
  interfacePermits?: InterfacePermits
  interfaceBody: InterfaceBody
  location: Location
}

export type Null = {
  kind: 'Null'
  location: Location
}

export type NullLiteral = {
  kind: 'NullLiteral'
  identifier: Identifier
  location: Location
}

export type NumericType = IntegralType | FloatingPointType

export type OctalLiteral = {
  kind: 'OctalLiteral'
  identifier: Identifier
  location: Location
}

export type ParenthesisExpression = {
  kind: 'ParenthesisExpression'
  expression: Expression
  location: Location
}

export type Pattern = TypePattern | RecordPattern

export type PostDecrementExpression = {
  kind: 'PostDecrementExpression'
  postfixExpression: PostfixExpression
  location: Location
}

export type PostfixExpression =
  | Primary
  | ExpressionName
  | PostIncrementExpression
  | PostDecrementExpression

export type PostIncrementExpression = {
  kind: 'PostIncrementExpression'
  postfixExpression: PostfixExpression
  location: Location
}

export type PreDecrementExpression = {
  kind: 'PreDecrementExpression'
  unaryExpression: UnaryExpression
  location: Location
}

export type PreIncrementExpression = {
  kind: 'PreIncrementExpression'
  unaryExpression: UnaryExpression
  location: Location
}

export type Primary = PrimaryNoNewArray | ArrayCreationExpression

export type PrimaryNoNewArray = Literal | ClassLiteral | This | TypeNameThis | ParenthesisExpression

export type PrimitiveType = NumericType | Boolean

export type ReceiverParameter = {
  kind: 'ReceiverParameter'
  unannType: UnannType
  identifier?: Identifier
  location: Location
}

export type RecordBody = {
  kind: 'RecordBody'
  recordBodyDeclarations: RecordBodyDeclaration[]
  location: Location
}

export type RecordBodyDeclaration = ClassBodyDeclaration | CompactConstructorDeclaration

export type RecordComponent =
  | {
      kind: 'RecordComponent'
      recordComponentModifiers: RecordComponentModifier[]
      unannType: UnannType
      identifier: Identifier
      location: Location
    }
  | VariableArityRecordComponent

export type RecordComponentList = {
  kind: 'RecordComponentList'
  recordComponents: RecordComponent[]
  location: Location
}

export type RecordComponentModifier = {}

export type RecordDeclaration = {
  kind: 'RecordDeclaration'
  classModifier: ClassModifier[]
  typeIdentifier: TypeIdentifier
  recordHeader: RecordHeader
  classImplements?: ClassImplements
  recordBody: RecordBody
}

export type RecordHeader = {
  kind: 'RecordHeader'
  recordComponentList?: RecordComponentList
  location: Location
}

export type RecordPattern = {
  kind: 'RecordPattern'
  referenceType: ReferenceType
  componentPatternList?: ComponentPatternList
  location: Location
}

export type ReferenceType = ClassOrInterfaceType | TypeVariable | ArrayType

export type Result =
  | UnannType
  | {
      kind: 'Void'
      location: Location
    }

export type ReturnStatement = {
  kind: 'ReturnStatement'
  expression?: Expression
  location: Location
}

export type SimpleTypeName = TypeIdentifier

export type Statement =
  | StatementWithoutTrailingSubstatement
  | LabeledStatement
  | IfThenStatement
  | IfThenElseStatement
  | WhileStatement
  | ForStatement

export type StatementExpression =
  | Assignment
  | PreIncrementExpression
  | PreDecrementExpression
  | PostIncrementExpression
  | PostDecrementExpression
  | MethodInvocation
  | ClassInstanceCreationExpression

export type StatementExpressionList = {
  kind: 'StatementExpressionList'
  statementExpressions: StatementExpression[]
  location: Location
}

export type StatementNoShortIf =
  | StatementWithoutTrailingSubstatement
  | LabeledStatementNoShortIf
  | IfThenElseStatementNoShortIf
  | WhileStatementNoShortIf
  | ForStatementNoShortIf

export type StatementWithoutTrailingSubstatement =
  | Block
  | EmptyStatement
  | ExpressionStatement
  | AssertStatement
  | SwitchStatement
  | DoStatement
  | BreakStatement
  | ContinueStatement
  | ReturnStatement
  | SynchronizedStatement
  | ThrowStatement
  | TryStatement
  | YieldStatement

export type StringLiteral = {
  kind: 'StringLiteral'
  identifier: Identifier
  location: Location
}

export type Super = {
  kind: 'Super'
  location: Location
}

export type SwitchBlock = {
  kind: 'SwitchBlock'
  switchBlockStatementGroups: SwitchBlockStatementGroup[]
  switchLabels: SwitchLabel[]
  location: Location
}

export type SwitchBlockStatementGroup = {
  kind: 'SwitchBlockStatementGroup'
  switchLabels: SwitchLabel[]
  blockStatements?: BlockStatements
  location: Location
}

export type SwitchExpression = {}

export type SwitchLabel = {
  kind: 'SwitchLabel'
  caseConstants?: CaseConstant[]
  null?: Null
  default?: Default
  casePatterns?: CasePattern[]
  guard?: Guard
  location: Location
}

export type SwitchStatement = {
  kind: 'SwitchStatement'
  expression: Expression
  switchBlock: SwitchBlock
  location: Location
  // switch ( Expression ) SwitchBlock
}

export type SynchronizedStatement = {
  kind: 'SynchronizedStatement'
  expression: Expression
  block: Block
  location: Location
}

export type This = {
  kind: 'This'
  location: Location
}

export type Throws = {
  kind: 'Throws'
  exceptionTypeList: ExceptionType[]
  location: Location
}

export type ThrowStatement = {
  kind: 'ThrowStatement'
  expression: Expression
  location: Location
}

export type TryStatement = {
  kind: 'TryStatement'
  block: Block
  catches?: Catches
  finally?: Finally
  location: Location
}

export type TypeIdentifier = Identifier

export type TypeName = TypeIdentifier

export type TypeNameThis = {
  kind: 'TypeNameThis'
  typeName: Identifier
  this: This
  location: Location
}

export type TypePattern = LocalVariableDeclaration

export type TypeVariable = TypeIdentifier

export type UnannArrayType = {
  kind: 'UnannArrayType'
  unannPrimitiveType?: UnannPrimitiveType
  unannClassOrInterfaceType?: UnannClassOrInterfaceType
  unannTypeVariable?: UnannTypeVariable
  dims: Dims
  location: Location
}

export type UnannClassOrInterfaceType = UnannClassType | UnannInterfaceType

export type UnannClassType = {
  kind: 'UnannClassType'
  unannClassOrInterfaceType?: UnannClassOrInterfaceType
  typeIdentifier: TypeIdentifier
  location: Location
}

export type UnannInterfaceType = UnannClassType

export type UnannPrimitiveType = NumericType | Boolean

export type UnannReferenceType = UnannClassOrInterfaceType | UnannTypeVariable | UnannArrayType

export type UnannType = UnannPrimitiveType | UnannReferenceType

export type UnannTypeVariable = TypeIdentifier

export type UnaryExpression =
  | PreIncrementExpression
  | PreDecrementExpression
  | {
      kind: 'UnaryExpression'
      prefixOperator: Identifier
      unaryExpression: UnaryExpression
      location: Location
    }
  | UnaryExpressionNotPlusMinus

export type UnaryExpressionNotPlusMinus =
  | PostfixExpression
  | {
      kind: 'UnaryExpressionNotPlusMinus'
      prefixOperator: Identifier
      unaryExpression: UnaryExpression
      location: Location
    }
  | CastExpression
  | SwitchExpression

export type UnqualifiedClassInstanceCreationExpression = {
  kind: 'UnqualifiedClassInstanceCreationExpression'
  classOrInterfaceTypeToInstantiate: ClassOrInterfaceTypeToInstantiate
  argumentList?: ArgumentList
  classBody?: ClassBody
  location: Location
}

export type UnqualifiedMethodIdentifier = Identifier

export type Var = {
  kind: 'Var'
  location: Location
}

export type VariableArityParameter = {
  kind: 'VariableArityParameter'
  variableModifiers: VariableModifier[]
  unannType: UnannType
  identifier: Identifier
  location: Location
}

export type VariableArityRecordComponent = {
  kind: 'VariableArityRecordComponent'
  recordComponentModifiers: RecordComponentModifier[]
  unannType: UnannType
  identifier: Identifier
  location: Location
}

export type VariableDeclarator = {
  kind: 'VariableDeclarator'
  variableDeclaratorId: VariableDeclaratorId
  variableInitializer?: VariableInitializer
  location: Location
}

export type VariableDeclaratorId = {
  kind: 'VariableDeclaratorId'
  identifier: Identifier
  dims: Dims
}

export type VariableDeclaratorList = {
  kind: 'VariableDeclaratorList'
  variableDeclarators: VariableDeclarator[]
  location: Location
}

export type VariableInitializer = Expression | ArrayInitializer

export type VariableModifier = Identifier

export type WhileStatement = {
  kind: 'WhileStatement'
  expression: Expression
  statement: Statement
  location: Location
}

export type WhileStatementNoShortIf = {
  kind: 'WhileStatementNoShortIf'
  expression: Expression
  statementNoShortIf: StatementNoShortIf
  location: Location
}

export type YieldStatement = {
  kind: 'YieldStatement'
  expression: Expression
  location: Location
}

/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseJavaCstVisitor, default as JavaParser } from 'java-parser'
import { getDimArray, getIdentifier, getLocation, getNode, getTypeIdentifier } from './utils'
import * as AST from './specificationTypes'

const BINARY_OPERATORS = [
  ['||'],
  ['&&'],
  ['|'],
  ['^'],
  ['&'],
  ['==', '!='],
  ['<', '>', '<=', '>='],
  ['<<', '>>', '>>>'],
  ['+', '-'],
  ['*', '/', '%']
] // Sorted from applied last to applied first

class AstExtractor extends BaseJavaCstVisitor {
  constructor() {
    super()
    this.validateVisitor()
  }

  additionalBound(ctx: JavaParser.AdditionalBoundCtx) {
    throw new Error('Not implemented')
  }

  ambiguousName(ctx: JavaParser.AmbiguousNameCtx): AST.AmbiguousName {
    const numIdentifiers = ctx.Identifier.length
    const lastIdentifier = ctx.Identifier[numIdentifiers - 1]
    if (!ctx.Dot || ctx.Dot.length === 0) {
      return {
        kind: 'AmbiguousName',
        identifier: getIdentifier(lastIdentifier),
        location: getLocation(lastIdentifier)
      }
    }

    ctx.Dot = ctx.Dot.slice(0, ctx.Dot.length - 1)
    ctx.Identifier = ctx.Identifier.slice(0, ctx.Identifier.length - 1)
    return {
      kind: 'AmbiguousName',
      ambiguousName: this.ambiguousName(ctx),
      identifier: getIdentifier(lastIdentifier),
      location: getLocation(lastIdentifier)
    }
  }

  annotation(ctx: JavaParser.AnnotationCtx) {
    throw new Error('Not implemented')
  }

  annotationTypeBody(ctx: JavaParser.AnnotationTypeBodyCtx) {
    throw new Error('Not implemented')
  }

  annotationTypeDeclaration(ctx: JavaParser.AnnotationTypeDeclarationCtx) {
    throw new Error('Not implemented')
  }

  annotationTypeElementDeclaration(ctx: JavaParser.AnnotationTypeElementDeclarationCtx) {
    throw new Error('Not implemented')
  }

  annotationTypeElementModifier(ctx: JavaParser.AnnotationTypeElementModifierCtx) {
    throw new Error('Not implemented')
  }

  annotationTypeMemberDeclaration(ctx: JavaParser.AnnotationTypeMemberDeclarationCtx) {
    throw new Error('Not implemented')
  }

  argumentList(ctx: JavaParser.ArgumentListCtx): AST.ArgumentList {
    return {
      kind: 'ArgumentList',
      expressions: ctx.expression.map(expression => this.visit(expression)),
      location: getLocation(ctx.expression[0].location)
    }
  }

  arrayAccessSuffix(
    ctx: JavaParser.ArrayAccessSuffixCtx
  ): Pick<AST.ArrayAccess, 'indexExpression' | 'kind' | 'location'> {
    return {
      kind: 'ArrayAccess',
      indexExpression: this.visit(ctx.expression),
      location: getLocation(ctx.LSquare[0])
    }
  }

  arrayCreationDefaultInitSuffix(
    ctx: JavaParser.ArrayCreationDefaultInitSuffixCtx
  ): Pick<AST.ArrayCreationExpressionWithoutInitializer, 'dimExprs' | 'dims' | 'kind'> {
    return {
      kind: 'ArrayCreationExpressionWithoutInitializer',
      dimExprs: this.visit(ctx.dimExprs),
      dims: ctx.dims ? this.visit(ctx.dims) : undefined
    }
  }

  arrayCreationExplicitInitSuffix(
    ctx: JavaParser.ArrayCreationExplicitInitSuffixCtx
  ): Pick<AST.ArrayCreationExpressionWithInitializer, 'arrayInitializer' | 'dims' | 'kind'> {
    return {
      kind: 'ArrayCreationExpressionWithInitializer',
      arrayInitializer: this.visit(ctx.arrayInitializer),
      dims: this.visit(ctx.dims)
    }
  }

  arrayCreationExpression(ctx: JavaParser.ArrayCreationExpressionCtx): AST.ArrayCreationExpression {
    if (ctx.primitiveType && ctx.arrayCreationDefaultInitSuffix) {
      return {
        ...this.visit(ctx.arrayCreationDefaultInitSuffix),
        type: this.visit(ctx.primitiveType),
        location: getLocation(ctx.New[0])
      }
    }
    if (ctx.classOrInterfaceType && ctx.arrayCreationDefaultInitSuffix) {
      return {
        ...this.visit(ctx.arrayCreationDefaultInitSuffix),
        type: this.visit(ctx.classOrInterfaceType),
        location: getLocation(ctx.New[0])
      }
    }
    if (ctx.primitiveType && ctx.arrayCreationExplicitInitSuffix) {
      return {
        ...this.visit(ctx.arrayCreationExplicitInitSuffix),
        type: this.visit(ctx.primitiveType),
        location: getLocation(ctx.New[0])
      }
    }
    // if (ctx.classOrInterfaceType && ctx.arrayCreationExplicitInitSuffix) {
    return {
      ...this.visit(ctx.arrayCreationExplicitInitSuffix!),
      type: this.visit(ctx.classOrInterfaceType!),
      location: getLocation(ctx.New[0])
    }
    // }
  }

  arrayInitializer(ctx: JavaParser.ArrayInitializerCtx): AST.ArrayInitializer {
    return {
      kind: 'ArrayInitializer',
      variableInitializerList: ctx.variableInitializerList
        ? this.visit(ctx.variableInitializerList)
        : undefined,
      location: getLocation(ctx.LCurly[0])
    }
  }

  assertStatement(ctx: JavaParser.AssertStatementCtx): AST.AssertStatement {
    return {
      kind: 'AssertStatement',
      expression1: this.visit(ctx.expression[0]),
      expression2: ctx.expression.length > 1 ? this.visit(ctx.expression[1]) : undefined,
      location: getLocation(ctx.Assert[0])
    }
  }

  basicForStatement(ctx: JavaParser.BasicForStatementCtx): AST.BasicForStatement {
    return {
      kind: 'BasicForStatement',
      forInit: ctx.forInit ? this.visit(ctx.forInit) : undefined,
      expression: ctx.expression ? this.visit(ctx.expression) : undefined,
      forUpdate: ctx.forUpdate ? this.visit(ctx.forUpdate) : undefined,
      statement: this.visit(ctx.statement[0]),
      location: getLocation(ctx.For[0])
    }
  }

  binaryExpression(ctx: JavaParser.BinaryExpressionCtx): AST.AssignmentExpression {
    if (ctx.AssignmentOperator && ctx.expression) {
      const assignment: AST.Assignment = {
        kind: 'Assignment',
        leftHandSide: this.visit(ctx.unaryExpression),
        assignmentOperator: getIdentifier(ctx.AssignmentOperator[0]),
        rightHandSide: this.visit(ctx.expression),
        location: getLocation(ctx.unaryExpression[0].location)
      }
      return assignment
    }

    if (ctx.BinaryOperator && ctx.BinaryOperator.length > 0 && ctx.unaryExpression) {
      for (const operatorGroup of BINARY_OPERATORS) {
        const numBinaryOperators = ctx.BinaryOperator.length
        // Grouping binary operations from back to front
        for (let i = numBinaryOperators - 1; i >= 0; i--) {
          const binaryOperator = ctx.BinaryOperator[i].image
          if (!operatorGroup.includes(binaryOperator)) continue
          const binaryExpression: AST.BinaryExpression = {
            kind: 'BinaryExpression',
            leftHandSide: this.binaryExpression({
              unaryExpression: ctx.unaryExpression.slice(0, i + 1),
              BinaryOperator: ctx.BinaryOperator.slice(0, i)
            }),
            binaryOperator: getIdentifier(ctx.BinaryOperator[i]),
            rightHandSide: this.binaryExpression({
              unaryExpression: ctx.unaryExpression.slice(i + 1),
              BinaryOperator: ctx.BinaryOperator.slice(i + 1)
            }),
            location: getLocation(ctx.BinaryOperator[i])
          }
          return binaryExpression
        }
      }
    }

    if (ctx.Greater) throw new Error('Not implemented')
    if (ctx.Instanceof) throw new Error('Not implemented')
    if (ctx.Less) throw new Error('Not implemented')
    if (ctx.expression) throw new Error('Not implemented')
    if (ctx.pattern) throw new Error('Not implemented')
    if (ctx.referenceType) throw new Error('Not implemented')

    return this.visit(ctx.unaryExpression)
  }

  block(ctx: JavaParser.BlockCtx): AST.Block {
    return {
      kind: 'Block',
      blockStatements: ctx.blockStatements ? this.visit(ctx.blockStatements) : undefined,
      location: getLocation(ctx.LCurly[0])
    }
  }

  blockStatement(ctx: JavaParser.BlockStatementCtx): AST.BlockStatement {
    if (ctx.interfaceDeclaration) return this.visit(ctx.interfaceDeclaration)
    if (ctx.classDeclaration) return this.visit(ctx.classDeclaration)
    if (ctx.localVariableDeclarationStatement)
      return this.visit(ctx.localVariableDeclarationStatement)
    // if (ctx.statement)
    return this.visit(ctx.statement!)
  }

  blockStatements(ctx: JavaParser.BlockStatementsCtx): AST.BlockStatements {
    return {
      kind: 'BlockStatements',
      blockStatements: ctx.blockStatement.map(blockStatement => this.visit(blockStatement)),
      location: getLocation(ctx.blockStatement[0].location)
    }
  }

  booleanLiteral(ctx: JavaParser.BooleanLiteralCtx): AST.BooleanLiteral {
    return [ctx.False, ctx.True]
      .filter(booleanLiteral => booleanLiteral !== undefined)
      .map(booleanLiteral => ({
        kind: 'BooleanLiteral' as const,
        identifier: getIdentifier(booleanLiteral![0]),
        location: getLocation(booleanLiteral![0])
      }))[0]
  }

  breakStatement(ctx: JavaParser.BreakStatementCtx): AST.BreakStatement {
    return {
      kind: 'BreakStatement',
      identifier: ctx.Identifier ? getIdentifier(ctx.Identifier[0]) : undefined,
      location: getLocation(ctx.Break[0])
    }
  }

  caseConstant(ctx: JavaParser.CaseConstantCtx): AST.CaseConstant {
    return this.visit(ctx.ternaryExpression)
  }

  caseLabelElement(
    ctx: JavaParser.CaseLabelElementCtx
  ): Omit<AST.SwitchLabel, 'kind' | 'location'> {
    if (ctx.caseConstant)
      return { caseConstants: ctx.caseConstant.map(caseConstant => this.visit(caseConstant)) }
    if (ctx.pattern) return { casePatterns: ctx.pattern.map(pattern => this.visit(pattern)) }
    if (ctx.Default) return { default: getNode(ctx.Default[0]) as AST.Default }
    // if (ctx.Null)
    return { null: getNode(ctx.Null![0]) as AST.Null }
  }

  caseOrDefaultLabel(ctx: JavaParser.CaseOrDefaultLabelCtx): AST.SwitchLabel {
    if (ctx.Case && ctx.caseLabelElement) {
      const caseLabelElements = ctx.caseLabelElement
        .map(caseLabelElement => this.visit(caseLabelElement))
        .reduce((accumulator, currentObject) => {
          Object.keys(currentObject).forEach(key => {
            if (Array.isArray(currentObject[key]) && accumulator[key]) {
              accumulator[key].push(...currentObject[key])
              return
            }
            accumulator[key] = currentObject[key]
          })
          return accumulator
        }, {})
      return {
        kind: 'SwitchLabel',
        ...caseLabelElements,
        location: getLocation(ctx.Case[0])
      } as AST.SwitchLabel
    }
    // if (ctx.Default)
    return getNode(ctx.Default![0]) as AST.Default
  }

  castExpression(ctx: JavaParser.CastExpressionCtx): AST.CastExpression {
    if (ctx.primitiveCastExpression) return this.visit(ctx.primitiveCastExpression)
    // if (ctx.referenceTypeCastExpression)
    return this.visit(ctx.referenceTypeCastExpression!)
  }

  catchClause(ctx: JavaParser.CatchClauseCtx): AST.CatchClause {
    return {
      kind: 'CatchClause',
      catchFormalParameter: this.visit(ctx.catchFormalParameter),
      block: this.visit(ctx.block),
      location: getLocation(ctx.Catch[0])
    }
  }

  catchFormalParameter(ctx: JavaParser.CatchFormalParameterCtx): AST.CatchFormalParameter {
    return {
      kind: 'CatchFormalParameter',
      variableModifiers: ctx.variableModifier
        ? ctx.variableModifier.map(variableModifier => this.visit(variableModifier))
        : [],
      catchType: this.visit(ctx.catchType),
      variableDeclaratorId: this.visit(ctx.variableDeclaratorId),
      location: ctx.variableModifier
        ? getLocation(ctx.variableModifier[0].location)
        : getLocation(ctx.catchType[0].location)
    }
  }

  catchType(ctx: JavaParser.CatchTypeCtx): AST.CatchType {
    return {
      kind: 'CatchType',
      unannClassType: this.visit(ctx.unannClassType),
      classTypes: ctx.classType ? ctx.classType.map(classType => this.visit(classType)) : undefined,
      location: getLocation(ctx.unannClassType[0].location)
    }
  }

  catches(ctx: JavaParser.CatchesCtx): AST.Catches {
    return {
      kind: 'Catches',
      catchClauses: ctx.catchClause.map(catchClause => this.visit(catchClause)),
      location: getLocation(ctx.catchClause[0].location)
    }
  }

  classBody(ctx: JavaParser.ClassBodyCtx): AST.ClassBody {
    return {
      kind: 'ClassBody',
      classBodyDeclarations: ctx.classBodyDeclaration
        ? ctx.classBodyDeclaration.map(declaration => this.visit(declaration))
        : [],
      location: getLocation(ctx.LCurly[0])
    }
  }

  classBodyDeclaration(ctx: JavaParser.ClassBodyDeclarationCtx): AST.ClassBodyDeclaration {
    if (ctx.classMemberDeclaration) return this.visit(ctx.classMemberDeclaration)
    if (ctx.constructorDeclaration) return this.visit(ctx.constructorDeclaration)
    if (ctx.instanceInitializer) return this.visit(ctx.instanceInitializer)
    // if (ctx.staticInitializer)
    return this.visit(ctx.staticInitializer!)
  }

  classDeclaration(ctx: JavaParser.ClassDeclarationCtx): AST.ClassDeclaration {
    if (ctx.enumDeclaration) return this.visit(ctx.enumDeclaration)
    const classModifiers = ctx.classModifier
      ? ctx.classModifier.map(modifier => this.visit(modifier))
      : []
    return [ctx.recordDeclaration, ctx.normalClassDeclaration]
      .filter(classDeclaration => classDeclaration !== undefined)
      .map(classDeclaration => ({
        ...this.visit(classDeclaration!),
        classModifiers,
        location:
          classModifiers.length > 0
            ? getLocation(ctx.classModifier![0].location)
            : classDeclaration![0].location
      }))[0]
  }

  classLiteralSuffix(ctx: JavaParser.ClassLiteralSuffixCtx): { dims: AST.Dim[] } {
    return { dims: ctx.LSquare ? getDimArray(ctx.LSquare) : [] }
  }

  classMemberDeclaration(ctx: JavaParser.ClassMemberDeclarationCtx): AST.ClassMemberDeclaration {
    if (ctx.classDeclaration) return this.visit(ctx.classDeclaration)
    if (ctx.fieldDeclaration) return this.visit(ctx.fieldDeclaration)
    if (ctx.interfaceDeclaration) return this.visit(ctx.interfaceDeclaration)
    // if (ctx.methodDeclaration)
    return this.visit(ctx.methodDeclaration!)
  }

  classModifier(ctx: JavaParser.ClassModifierCtx): AST.ClassModifier {
    if (ctx.annotation) throw new Error('Not implemented')
    return [
      ctx.Abstract,
      ctx.Final,
      ctx.NonSealed,
      ctx.Private,
      ctx.Protected,
      ctx.Public,
      ctx.Sealed,
      ctx.Static,
      ctx.Strictfp
    ]
      .filter(modifier => modifier !== undefined)
      .map(modifier => getIdentifier(modifier![0]))[0]
  }

  classOrInterfaceType(ctx: JavaParser.ClassOrInterfaceTypeCtx): AST.ClassOrInterfaceType {
    return this.visit(ctx.classType)
  }

  classOrInterfaceTypeToInstantiate(
    ctx: JavaParser.ClassOrInterfaceTypeToInstantiateCtx
  ): AST.ClassOrInterfaceTypeToInstantiate {
    if (ctx.annotation) throw new Error('Not implemented')
    if (ctx.typeArgumentsOrDiamond) throw new Error('Not implemented')
    return {
      kind: 'ClassOrInterfaceTypeToInstantiate',
      identifiers: ctx.Identifier.map(identifier => getIdentifier(identifier)),
      location: getLocation(ctx.Identifier[0])
    }
  }

  classPermits(ctx: JavaParser.ClassPermitsCtx): AST.ClassPermits {
    return {
      kind: 'ClassPermits',
      typeNames: ctx.typeName.map(typeName => this.visit(typeName)),
      location: getLocation(ctx.Permits[0])
    }
  }

  classType(ctx: JavaParser.ClassTypeCtx): AST.ClassType {
    if (ctx.annotation) throw new Error('Not implemented')
    if (ctx.typeArguments) throw new Error('Not implemented')
    if (ctx.Identifier.length > 1) throw new Error('Not implemented')
    return {
      kind: 'ClassType',
      typeIdentifier: getIdentifier(ctx.Identifier[0]),
      location: getLocation(ctx.Identifier[0])
    }
  }

  compactConstructorDeclaration(
    ctx: JavaParser.CompactConstructorDeclarationCtx
  ): AST.CompactConstructorDeclaration {
    return {
      kind: 'CompactConstructorDeclaration',
      constructorModifiers: ctx.constructorModifier
        ? ctx.constructorModifier.map(constructorModifier => this.visit(constructorModifier))
        : [],
      simpleTypeName: this.visit(ctx.simpleTypeName),
      constructorBody: this.visit(ctx.constructorBody),
      location: ctx.constructorModifier
        ? getLocation(ctx.constructorModifier[0].location)
        : getLocation(ctx.simpleTypeName[0].location)
    }
  }

  compilationUnit(ctx: JavaParser.CompilationUnitCtx): AST.CompilationUnit {
    // @ts-expect-error ts(2339)
    if (ctx.ordinaryCompilationUnit) return this.visit(ctx.ordinaryCompilationUnit)
    throw new Error('Not implemented')
  }

  continueStatement(ctx: JavaParser.ContinueStatementCtx): AST.ContinueStatement {
    return {
      kind: 'ContinueStatement',
      identifier: ctx.Identifier ? getIdentifier(ctx.Identifier[0]) : undefined,
      location: getLocation(ctx.Continue[0])
    }
  }

  constantDeclaration(ctx: JavaParser.ConstantDeclarationCtx): AST.ConstantDeclaration {
    return {
      kind: 'ConstantDeclaration',
      constantModifiers: ctx.constantModifier
        ? ctx.constantModifier.map(constantModifier => this.visit(constantModifier))
        : [],
      unannType: this.visit(ctx.unannType),
      variableDeclaratorList: this.visit(ctx.variableDeclaratorList),
      location: ctx.constantModifier
        ? getLocation(ctx.constantModifier[0].location)
        : getLocation(ctx.unannType[0].location)
    }
  }

  constantModifier(ctx: JavaParser.ConstantModifierCtx): AST.ConstantModifier {
    if (ctx.annotation) throw new Error('Not implemented')
    return [ctx.Final, ctx.Public, ctx.Static]
      .filter(constantModifier => constantModifier !== undefined)
      .map(constantModifier => getIdentifier(constantModifier![0]))[0]
  }

  constructorBody(ctx: JavaParser.ConstructorBodyCtx): AST.ConstructorBody {
    return {
      kind: 'ConstructorBody',
      explicitConstructorInvocation: ctx.explicitConstructorInvocation
        ? this.visit(ctx.explicitConstructorInvocation)
        : undefined,
      blockStatements: ctx.blockStatements ? this.visit(ctx.blockStatements) : undefined,
      location: getLocation(ctx.LCurly[0])
    }
  }

  constructorDeclaration(ctx: JavaParser.ConstructorDeclarationCtx): AST.ConstructorDeclaration {
    return {
      kind: 'ConstructorDeclaration',
      constructorModifiers: ctx.constructorModifier
        ? ctx.constructorModifier.map(constructorModifier => this.visit(constructorModifier))
        : [],
      constructorDeclarator: this.visit(ctx.constructorDeclarator),
      throws: ctx.throws ? this.visit(ctx.throws) : undefined,
      constructorBody: this.visit(ctx.constructorBody),
      location: ctx.constructorModifier
        ? getLocation(ctx.constructorModifier[0].location)
        : getLocation(ctx.constructorDeclarator[0].location)
    }
  }

  constructorDeclarator(ctx: JavaParser.ConstructorDeclaratorCtx): AST.ConstructorDeclarator {
    if (ctx.typeParameters) throw new Error('Not implemented')
    return {
      kind: 'ConstructorDeclarator',
      simpleTypeName: this.visit(ctx.simpleTypeName),
      receiverParameter: ctx.receiverParameter ? this.visit(ctx.receiverParameter) : undefined,
      formalParameterList: ctx.formalParameterList
        ? this.visit(ctx.formalParameterList)
        : undefined,
      location: getLocation(ctx.simpleTypeName[0].location)
    }
  }

  constructorModifier(ctx: JavaParser.ConstructorModifierCtx): AST.ConstantModifier {
    if (ctx.annotation) throw new Error('Not implemented')
    return [ctx.Private, ctx.Protected, ctx.Public]
      .filter(constructorModifier => constructorModifier !== undefined)
      .map(constructorModifier => getIdentifier(constructorModifier![0]))[0]
  }

  defaultValue(ctx: JavaParser.DefaultValueCtx) {
    throw new Error('Not implemented')
  }

  diamond(ctx: JavaParser.DiamondCtx) {
    throw new Error('Not implemented')
  }

  dimExpr(ctx: JavaParser.DimExprCtx): AST.DimExpr {
    if (ctx.annotation) throw new Error('Not implemented')
    return {
      kind: 'DimExpr',
      expression: this.visit(ctx.expression),
      location: getLocation(ctx.LSquare[0])
    }
  }

  dimExprs(ctx: JavaParser.DimExprsCtx): AST.DimExprs {
    return {
      kind: 'DimExprs',
      dimExprs: ctx.dimExpr.map(dimExpr => this.visit(dimExpr)),
      location: getLocation(ctx.dimExpr[0].location)
    }
  }

  dims(ctx: JavaParser.DimsCtx): AST.Dims {
    if (ctx.annotation) throw new Error('Not implemented')
    return {
      kind: 'Dims',
      dims: ctx.LSquare.map(lSquare => ({ kind: 'Dim', location: getLocation(lSquare) })),
      location: getLocation(ctx.LSquare[0])
    }
  }

  doStatement(ctx: JavaParser.DoStatementCtx): AST.DoStatement {
    return {
      kind: 'DoStatement',
      statement: this.visit(ctx.statement),
      expression: this.visit(ctx.expression),
      location: getLocation(ctx.Do[0])
    }
  }

  elementValue(ctx: JavaParser.ElementValueCtx) {
    throw new Error('Not implemented')
  }

  elementValueArrayInitializer(ctx: JavaParser.ElementValueArrayInitializerCtx) {
    throw new Error('Not implemented')
  }

  elementValueList(ctx: JavaParser.ElementValueListCtx) {
    throw new Error('Not implemented')
  }

  elementValuePair(ctx: JavaParser.ElementValuePairCtx) {
    throw new Error('Not implemented')
  }

  elementValuePairList(ctx: JavaParser.ElementValuePairListCtx) {
    throw new Error('Not implemented')
  }

  emptyStatement(ctx: JavaParser.EmptyStatementCtx): AST.EmptyStatement {
    return {
      kind: 'EmptyStatement',
      location: getLocation(ctx.Semicolon[0])
    }
  }

  enhancedForStatement(ctx: JavaParser.EnhancedForStatementCtx): AST.EnhancedForStatement {
    return {
      kind: 'EnhancedForStatement',
      localVariableDeclaration: {
        kind: 'LocalVariableDeclaration',
        variableModifiers: [],
        localVariableType: this.visit(ctx.localVariableType),
        variableDeclaratorList: {
          kind: 'VariableDeclaratorList',
          variableDeclarators: [
            {
              kind: 'VariableDeclarator',
              variableDeclaratorId: this.visit(ctx.variableDeclaratorId),
              location: getLocation(ctx.variableDeclaratorId[0].location)
            }
          ],
          location: getLocation(ctx.variableDeclaratorId[0].location)
        },
        location: getLocation(ctx.localVariableType[0].location)
      },
      expression: this.visit(ctx.expression),
      statement: this.visit(ctx.statement),
      location: getLocation(ctx.For[0])
    }
  }

  enumBody(ctx: JavaParser.EnumBodyCtx): AST.EnumBody {
    return {
      kind: 'EnumBody',
      enumConstantList: ctx.enumConstantList ? this.visit(ctx.enumConstantList) : [],
      enumBodyDeclarations: ctx.enumBodyDeclarations ? this.visit(ctx.enumBodyDeclarations) : [],
      location: getLocation(ctx.LCurly[0])
    }
  }

  enumBodyDeclarations(ctx: JavaParser.EnumBodyDeclarationsCtx): AST.EnumBodyDeclarations {
    return {
      kind: 'EnumBodyDeclarations',
      classBodyDeclaration: ctx.classBodyDeclaration
        ? ctx.classBodyDeclaration.map(classBodyDeclaration => this.visit(classBodyDeclaration))
        : [],
      location: getLocation(ctx.Semicolon[0])
    }
  }

  enumConstant(ctx: JavaParser.EnumConstantCtx): AST.EnumConstant {
    return {
      kind: 'EnumConstant',
      enumConstantModifiers: ctx.enumConstantModifier
        ? ctx.enumConstantModifier.map(enumConstantModifier => this.visit(enumConstantModifier))
        : [],
      identifier: getIdentifier(ctx.Identifier[0]),
      argumentList: ctx.argumentList ? this.visit(ctx.argumentList) : undefined,
      classBody: ctx.classBody ? this.visit(ctx.classBody) : undefined,
      location: ctx.enumConstantModifier
        ? getLocation(ctx.enumConstantModifier[0].location)
        : getLocation(ctx.Identifier[0])
    }
  }

  enumConstantList(ctx: JavaParser.EnumConstantListCtx): AST.EnumConstantList {
    return {
      kind: 'EnumConstantList',
      enumConstants: ctx.enumConstant.map(enumConstant => this.visit(enumConstant)),
      location: getLocation(ctx.enumConstant[0].location)
    }
  }

  enumConstantModifier(ctx: JavaParser.EnumConstantModifierCtx): AST.EnumConstantModifier {
    throw new Error('Not implemented')
  }

  enumDeclaration(ctx: JavaParser.EnumDeclarationCtx): AST.EnumDeclaration {
    return {
      kind: 'EnumDeclaration',
      classModifiers: ctx.classModifier
        ? ctx.classModifier.map(classModifier => this.visit(classModifier))
        : [],
      typeIdentifier: this.visit(ctx.typeIdentifier),
      classImplements: ctx.superinterfaces ? this.visit(ctx.superinterfaces) : undefined,
      enumBody: this.visit(ctx.enumBody),
      location: ctx.classModifier
        ? getLocation(ctx.classModifier[0].location)
        : getLocation(ctx.Enum[0])
    }
  }

  exceptionType(ctx: JavaParser.ExceptionTypeCtx): AST.ExceptionType {
    return this.visit(ctx.classType)
  }

  exceptionTypeList(ctx: JavaParser.ExceptionTypeListCtx): AST.ExceptionType[] {
    return ctx.exceptionType.map(exceptionType => this.visit(exceptionType))
  }

  explicitConstructorInvocation(
    ctx: JavaParser.ExplicitConstructorInvocationCtx
  ): AST.ExplicitConstructorInvocation {
    if (ctx.qualifiedExplicitConstructorInvocation)
      return this.visit(ctx.qualifiedExplicitConstructorInvocation)
    // if (ctx.unqualifiedExplicitConstructorInvocation)
    return this.visit(ctx.unqualifiedExplicitConstructorInvocation!)
  }

  explicitLambdaParameterList(
    ctx: JavaParser.ExplicitLambdaParameterListCtx
  ): AST.LambdaParameterList {
    return {
      kind: 'LambdaParameterList',
      normalLambdaParameters: ctx.lambdaParameter.map(lambdaParameter =>
        this.visit(lambdaParameter)
      ),
      location: getLocation(ctx.lambdaParameter[0].location)
    }
  }

  exportsModuleDirective(ctx: JavaParser.ExportsModuleDirectiveCtx) {
    throw new Error('Not implemented')
  }

  expression(ctx: JavaParser.ExpressionCtx): AST.Expression {
    if (ctx.lambdaExpression) return this.visit(ctx.lambdaExpression)
    // if (ctx.ternaryExpression)
    return this.visit(ctx.ternaryExpression!)
  }

  expressionName(ctx: JavaParser.ExpressionNameCtx): AST.ExpressionName {
    if (ctx.Dot) throw new Error('Not implemented')
    return {
      kind: 'ExpressionName',
      identifier: getIdentifier(ctx.Identifier[0]),
      location: getLocation(ctx.Identifier[0])
    }
  }

  expressionStatement(ctx: JavaParser.ExpressionStatementCtx): AST.ExpressionStatement {
    return this.visit(ctx.statementExpression)
  }

  extendsInterfaces(ctx: JavaParser.ExtendsInterfacesCtx): AST.InterfaceExtends {
    return {
      kind: 'InterfaceExtends',
      interfaceTypeList: this.visit(ctx.interfaceTypeList),
      location: getLocation(ctx.Extends[0])
    }
  }

  fieldDeclaration(ctx: JavaParser.FieldDeclarationCtx): AST.FieldDeclaration {
    return {
      kind: 'FieldDeclaration',
      fieldModifiers: ctx.fieldModifier
        ? ctx.fieldModifier.map(fieldModifier => this.visit(fieldModifier))
        : [],
      unannType: this.visit(ctx.unannType),
      variableDeclaratorList: this.visit(ctx.variableDeclaratorList),
      location: ctx.fieldModifier
        ? getLocation(ctx.fieldModifier[0].location)
        : getLocation(ctx.unannType[0].location)
    }
  }

  fieldModifier(ctx: JavaParser.FieldModifierCtx): AST.FieldModifier {
    if (ctx.annotation) throw new Error('Not implemented')
    return [
      ctx.Final,
      ctx.Private,
      ctx.Protected,
      ctx.Public,
      ctx.Static,
      ctx.Transient,
      ctx.Volatile
    ]
      .filter(modifier => modifier !== undefined)
      .map(modifier => getIdentifier(modifier![0]))[0]
  }

  finally(ctx: JavaParser.FinallyCtx): AST.Finally {
    return {
      kind: 'Finally',
      block: this.visit(ctx.block),
      location: getLocation(ctx.Finally[0])
    }
  }

  floatingPointLiteral(ctx: JavaParser.FloatingPointLiteralCtx): AST.FloatingPointLiteral {
    if (ctx.FloatLiteral) {
      return {
        kind: 'DecimalFloatingPointLiteral',
        identifier: getIdentifier(ctx.FloatLiteral[0]),
        location: getLocation(ctx.FloatLiteral[0])
      }
    }
    return {
      kind: 'HexadecimalFloatingPointLiteral',
      identifier: getIdentifier(ctx.HexFloatLiteral![0]),
      location: getLocation(ctx.HexFloatLiteral![0])
    }
  }

  floatingPointType(ctx: JavaParser.FloatingPointTypeCtx): AST.FloatingPointType {
    return [ctx.Double, ctx.Float]
      .filter(floatingPointType => floatingPointType !== undefined)
      .map(floatingPointType => ({
        kind: 'FloatingPointType' as const,
        identifier: getIdentifier(floatingPointType![0]),
        location: getLocation(floatingPointType![0])
      }))[0]
  }

  forInit(ctx: JavaParser.ForInitCtx): AST.ForInit {
    if (ctx.localVariableDeclaration) return this.visit(ctx.localVariableDeclaration)
    // if (ctx.statementExpressionList)
    return this.visit(ctx.statementExpressionList!)
  }

  formalParameter(ctx: JavaParser.FormalParameterCtx): AST.FormalParameter {
    if (ctx.variableArityParameter) return this.visit(ctx.variableArityParameter)
    // if (ctx.variableParaRegularParameter)
    return this.visit(ctx.variableParaRegularParameter!)
  }

  formalParameterList(ctx: JavaParser.FormalParameterListCtx): AST.FormalParameterList {
    return {
      kind: 'FormalParameterList',
      formalParameters: ctx.formalParameter.map(formalParameter => this.visit(formalParameter)),
      location: getLocation(ctx.formalParameter[0].location)
    }
  }

  forStatement(ctx: JavaParser.ForStatementCtx): AST.ForStatement {
    if (ctx.basicForStatement) return this.visit(ctx.basicForStatement)
    // if (ctx.enhancedForStatement)
    return this.visit(ctx.enhancedForStatement!)
  }

  forUpdate(ctx: JavaParser.ForUpdateCtx): AST.ForUpdate {
    return this.visit(ctx.statementExpressionList)
  }

  // TODO:
  // @ts-expect-error ts(7023)
  fqnOrRefType(ctx: JavaParser.FqnOrRefTypeCtx) {
    if (ctx.Dot && ctx.fqnOrRefTypePartRest && ctx.fqnOrRefTypePartRest.length > 0) {
      const lastPartIndex = ctx.fqnOrRefTypePartRest.length - 1
      const lastDot = ctx.Dot[lastPartIndex]
      ctx.Dot = ctx.Dot.slice(0, lastPartIndex)
      const lastFqnOrRefTypePartRest = ctx.fqnOrRefTypePartRest[lastPartIndex]
      ctx.fqnOrRefTypePartRest = ctx.fqnOrRefTypePartRest.slice(0, lastPartIndex)
      return {
        kind: 'FieldAccess',
        identifier: this.visit(lastFqnOrRefTypePartRest),
        primary: this.fqnOrRefType(ctx),
        location: getLocation(lastDot)
      }
    }
    if (ctx.fqnOrRefTypePartFirst && ctx.dims) {
      const fqnOrRefTypePartFirst = this.visit(ctx.fqnOrRefTypePartFirst)
      if (fqnOrRefTypePartFirst.kind !== 'Identifier') throw new Error('Not implemented')
      const unannArrayType: AST.UnannArrayType = {
        kind: 'UnannArrayType',
        type: fqnOrRefTypePartFirst,
        dims: this.visit(ctx.dims),
        location: getLocation(ctx.fqnOrRefTypePartFirst[0].location)
      }
      return unannArrayType
    }
    if (ctx.Dot && ctx.Dot.length > 0) throw new Error('Not implemented')
    if (ctx.dims) throw new Error('Not implemented')
    if (ctx.fqnOrRefTypePartRest && ctx.fqnOrRefTypePartRest.length > 0)
      throw new Error('Not implemented')
    return this.visit(ctx.fqnOrRefTypePartFirst)
  }

  fqnOrRefTypePartCommon(ctx: JavaParser.FqnOrRefTypePartCommonCtx) {
    if (ctx.typeArguments) throw new Error('Not implemented')
    if (ctx.Identifier) return getTypeIdentifier(ctx.Identifier[0])
    if (ctx.Super) return getTypeIdentifier(ctx.Super[0])
  }

  fqnOrRefTypePartFirst(ctx: JavaParser.FqnOrRefTypePartFirstCtx) {
    if (ctx.annotation) throw new Error('Not implemented')
    return this.visit(ctx.fqnOrRefTypePartCommon)
  }

  fqnOrRefTypePartRest(ctx: JavaParser.FqnOrRefTypePartRestCtx) {
    if (ctx.annotation) throw new Error('Not implemented')
    if (ctx.typeArguments) throw new Error('Not implemented')
    return this.visit(ctx.fqnOrRefTypePartCommon)
  }

  identifyAnnotationBodyDeclarationType(ctx: JavaParser.IdentifyAnnotationBodyDeclarationTypeCtx) {
    throw new Error('Not implemented')
  }

  identifyClassBodyDeclarationType(ctx: JavaParser.IdentifyClassBodyDeclarationTypeCtx) {
    throw new Error('Not implemented')
  }

  identifyInterfaceBodyDeclarationType(ctx: JavaParser.IdentifyInterfaceBodyDeclarationTypeCtx) {
    throw new Error('Not implemented')
  }

  identifyNewExpressionType(ctx: JavaParser.IdentifyNewExpressionTypeCtx) {
    throw new Error('Not implemented')
  }

  // TODO: Might need 2 passes of AST to convert StatementNoShortIf
  ifStatement(ctx: JavaParser.IfStatementCtx): AST.IfThenStatement | AST.IfThenElseStatement {
    if (!ctx.Else) {
      const ifThenStatement: AST.IfThenStatement = {
        kind: 'IfThenStatement',
        expression: this.visit(ctx.expression),
        statement: this.visit(ctx.statement),
        location: getLocation(ctx.If[0])
      }
      return ifThenStatement
    }

    const ifThenElseStatement: AST.IfThenElseStatement = {
      kind: 'IfThenElseStatement',
      expression: this.visit(ctx.expression),
      statementNoShortIf: this.visit(ctx.statement[0]),
      statement: this.visit(ctx.statement[1]),
      location: getLocation(ctx.If[0])
    }
    return ifThenElseStatement
  }

  importDeclaration(ctx: JavaParser.ImportDeclarationCtx) {
    throw new Error('Not implemented')
  }

  inferredLambdaParameterList(
    ctx: JavaParser.InferredLambdaParameterListCtx
  ): AST.LambdaParameterList {
    return {
      kind: 'LambdaParameterList',
      conciseLambdaParameters: ctx.Identifier.map(identifier => getIdentifier(identifier)),
      location: getLocation(ctx.Identifier[0])
    }
  }

  instanceInitializer(ctx: JavaParser.InstanceInitializerCtx): AST.InstanceInitializer {
    return this.visit(ctx.block)
  }

  integerLiteral(ctx: JavaParser.IntegerLiteralCtx): AST.IntegerLiteral {
    if (ctx.BinaryLiteral) {
      return {
        kind: 'BinaryLiteral',
        identifier: getIdentifier(ctx.BinaryLiteral[0]),
        location: getLocation(ctx.BinaryLiteral[0])
      }
    }

    if (ctx.DecimalLiteral) {
      return {
        kind: 'DecimalLiteral',
        identifier: getIdentifier(ctx.DecimalLiteral[0]),
        location: getLocation(ctx.DecimalLiteral[0])
      }
    }

    if (ctx.HexLiteral) {
      return {
        kind: 'HexLiteral',
        identifier: getIdentifier(ctx.HexLiteral[0]),
        location: getLocation(ctx.HexLiteral[0])
      }
    }

    return {
      kind: 'OctalLiteral',
      identifier: getIdentifier(ctx.OctalLiteral![0]),
      location: getLocation(ctx.OctalLiteral![0])
    }
  }

  integralType(ctx: JavaParser.IntegralTypeCtx): AST.IntegralType {
    return [ctx.Byte, ctx.Char, ctx.Int, ctx.Long, ctx.Short]
      .filter(integralType => integralType !== undefined)
      .map(integralType => ({
        kind: 'IntegralType' as const,
        identifier: getIdentifier(integralType![0]),
        location: getLocation(integralType![0])
      }))[0]
  }

  interfaceBody(ctx: JavaParser.InterfaceBodyCtx): AST.InterfaceBody {
    ctx.interfaceMemberDeclaration
    return {
      kind: 'InterfaceBody',
      interfaceMemberDeclarations: ctx.interfaceMemberDeclaration
        ? ctx.interfaceMemberDeclaration.map(interfaceMemberDeclaration =>
            this.visit(interfaceMemberDeclaration)
          )
        : [],
      location: getLocation(ctx.LCurly[0])
    }
  }

  interfaceDeclaration(ctx: JavaParser.InterfaceDeclarationCtx): AST.InterfaceDeclaration {
    if (ctx.annotationTypeDeclaration) throw new Error('Not implemented')
    // if (ctx.normalInterfaceDeclaration) {
    return {
      ...this.visit(ctx.normalInterfaceDeclaration!),
      interfaceModifiers: ctx.interfaceModifier
        ? ctx.interfaceModifier.map(interfaceModifier => this.visit(interfaceModifier))
        : [],
      location: ctx.interfaceModifier
        ? getLocation(ctx.interfaceModifier[0].location)
        : getLocation(ctx.normalInterfaceDeclaration![0].location)
    }
    // }
  }

  interfaceMemberDeclaration(
    ctx: JavaParser.InterfaceMemberDeclarationCtx
  ): AST.InterfaceMemberDeclaration {
    if (ctx.classDeclaration) return this.visit(ctx.classDeclaration)
    if (ctx.constantDeclaration) return this.visit(ctx.constantDeclaration)
    if (ctx.interfaceDeclaration) return this.visit(ctx.interfaceDeclaration)
    // if (ctx.interfaceMethodDeclaration)
    return this.visit(ctx.interfaceMethodDeclaration!)
  }

  interfaceMethodDeclaration(
    ctx: JavaParser.InterfaceMethodDeclarationCtx
  ): AST.InterfaceMethodDeclaration {
    return {
      kind: 'InterfaceMethodDeclaration',
      interfaceMethodModifiers: ctx.interfaceMethodModifier
        ? ctx.interfaceMethodModifier.map(interfaceMethodModifier =>
            this.visit(interfaceMethodModifier)
          )
        : [],
      methodHeader: this.visit(ctx.methodHeader),
      methodBody: this.visit(ctx.methodBody),
      location: ctx.interfaceMethodModifier
        ? getLocation(ctx.interfaceMethodModifier[0].location)
        : getLocation(ctx.methodHeader[0].location)
    }
  }

  interfaceMethodModifier(ctx: JavaParser.InterfaceMethodModifierCtx): AST.InterfaceMethodModifier {
    if (ctx.annotation) throw new Error('Not implemented')
    return [ctx.Abstract, ctx.Default, ctx.Private, ctx.Public, ctx.Static, ctx.Strictfp]
      .filter(interfaceModifier => interfaceModifier !== undefined)
      .map(interfaceModifier => getIdentifier(interfaceModifier![0]))[0]
  }

  interfaceModifier(ctx: JavaParser.InterfaceModifierCtx): AST.InterfaceModifier {
    if (ctx.annotation) throw new Error('Not implemented')
    return [
      ctx.Abstract,
      ctx.NonSealed,
      ctx.Private,
      ctx.Protected,
      ctx.Public,
      ctx.Sealed,
      ctx.Static,
      ctx.Strictfp
    ]
      .filter(interfaceModifier => interfaceModifier !== undefined)
      .map(interfaceModifier => getIdentifier(interfaceModifier![0]))[0]
  }

  interfacePermits(ctx: JavaParser.InterfacePermitsCtx): AST.InterfacePermits {
    return {
      kind: 'InterfacePermits',
      typeNames: ctx.typeName.map(typeName => this.visit(typeName)),
      location: getLocation(ctx.Permits[0])
    }
  }

  interfaceType(ctx: JavaParser.InterfaceTypeCtx): AST.InterfaceType {
    return this.visit(ctx.classType)
  }

  interfaceTypeList(ctx: JavaParser.InterfaceTypeListCtx): AST.InterfaceTypeList {
    return {
      kind: 'InterfaceTypeList',
      interfaceTypes: ctx.interfaceType.map(interfaceType => this.visit(interfaceType)),
      location: getLocation(ctx.interfaceType[0].location)
    }
  }

  isBasicForStatement(ctx: JavaParser.IsBasicForStatementCtx) {
    throw new Error('Not implemented')
  }

  isCastExpression(ctx: JavaParser.IsCastExpressionCtx) {
    throw new Error('Not implemented')
  }

  isClassDeclaration(ctx: JavaParser.IsClassDeclarationCtx) {
    throw new Error('Not implemented')
  }

  isClassicSwitchLabel(ctx: JavaParser.IsClassicSwitchLabelCtx) {
    throw new Error('Not implemented')
  }

  isCompactConstructorDeclaration(ctx: JavaParser.IsCompactConstructorDeclarationCtx) {
    throw new Error('Not implemented')
  }

  isDims(ctx: JavaParser.IsDimsCtx) {
    throw new Error('Not implemented')
  }

  isLambdaExpression(ctx: JavaParser.IsLambdaExpressionCtx) {
    throw new Error('Not implemented')
  }

  isLocalVariableDeclaration(ctx: JavaParser.IsLocalVariableDeclarationCtx) {
    throw new Error('Not implemented')
  }

  isModuleCompilationUnit(ctx: JavaParser.IsModuleCompilationUnitCtx) {
    throw new Error('Not implemented')
  }

  isPrimitiveCastExpression(ctx: JavaParser.IsPrimitiveCastExpressionCtx) {
    throw new Error('Not implemented')
  }

  isRefTypeInMethodRef(ctx: JavaParser.IsRefTypeInMethodRefCtx) {
    throw new Error('Not implemented')
  }

  isReferenceTypeCastExpression(ctx: JavaParser.IsReferenceTypeCastExpressionCtx) {
    throw new Error('Not implemented')
  }

  isSimpleElementValueAnnotation(ctx: JavaParser.IsSimpleElementValueAnnotationCtx) {
    throw new Error('Not implemented')
  }

  labeledStatement(ctx: JavaParser.LabeledStatementCtx): AST.LabeledStatement {
    return {
      kind: 'LabeledStatement',
      identifier: getIdentifier(ctx.Identifier[0]),
      statement: this.visit(ctx.statement),
      location: getLocation(ctx.Identifier[0])
    }
  }

  lambdaBody(ctx: JavaParser.LambdaBodyCtx): AST.LambdaBody {
    if (ctx.block) return this.visit(ctx.block)
    // if (ctx.expression)
    return this.visit(ctx.expression!)
  }

  lambdaExpression(ctx: JavaParser.LambdaExpressionCtx): AST.LambdaExpression {
    return {
      kind: 'LambdaExpression',
      lambdaParameters: this.visit(ctx.lambdaParameters),
      lambdaBody: this.visit(ctx.lambdaBody),
      location: getLocation(ctx.lambdaParameters[0].location)
    }
  }

  lambdaParameter(ctx: JavaParser.LambdaParameterCtx): AST.NormalLambdaParameter {
    if (ctx.regularLambdaParameter) return this.visit(ctx.regularLambdaParameter)
    // if (ctx.variableArityParameter)
    return this.visit(ctx.variableArityParameter!)
  }

  lambdaParameterList(ctx: JavaParser.LambdaParameterListCtx): AST.LambdaParameterList {
    if (ctx.explicitLambdaParameterList) return this.visit(ctx.explicitLambdaParameterList)
    // if (ctx.inferredLambdaParameterList)
    return this.visit(ctx.inferredLambdaParameterList!)
  }

  lambdaParameterType(ctx: JavaParser.LambdaParameterTypeCtx): AST.LambdaParameterType {
    if (ctx.Var) return getIdentifier(ctx.Var[0])
    // if (ctx.unannType)
    return this.visit(ctx.unannType!)
  }

  lambdaParameters(ctx: JavaParser.LambdaParametersCtx): AST.LambdaParameters {
    if (ctx.lambdaParametersWithBraces) return this.visit(ctx.lambdaParametersWithBraces)
    // if (ctx.Identifier) {
    return {
      kind: 'LambdaParameters',
      lambdaParameterList: {
        kind: 'LambdaParameterList',
        conciseLambdaParameters: [getIdentifier(ctx.Identifier![0])],
        location: getLocation(ctx.Identifier![0])
      },
      location: getLocation(ctx.Identifier![0])
    }
    // }
  }

  lambdaParametersWithBraces(ctx: JavaParser.LambdaParametersWithBracesCtx): AST.LambdaParameters {
    return {
      kind: 'LambdaParameters',
      lambdaParameterList: ctx.lambdaParameterList
        ? this.visit(ctx.lambdaParameterList)
        : undefined,
      location: getLocation(ctx.LBrace[0])
    }
  }

  literal(ctx: JavaParser.LiteralCtx): AST.Literal {
    if (ctx.integerLiteral) return this.visit(ctx.integerLiteral)
    if (ctx.floatingPointLiteral) return this.visit(ctx.floatingPointLiteral)
    if (ctx.booleanLiteral) return this.visit(ctx.booleanLiteral)

    if (ctx.CharLiteral) {
      return {
        kind: 'CharacterLiteral',
        identifier: getIdentifier(ctx.CharLiteral[0]),
        location: getLocation(ctx.CharLiteral[0])
      }
    }

    for (const stringLiteral of [ctx.TextBlock, ctx.StringLiteral]) {
      if (!stringLiteral) continue
      return {
        kind: 'StringLiteral',
        identifier: getIdentifier(stringLiteral[0]),
        location: getLocation(stringLiteral[0])
      }
    }

    return {
      kind: 'NullLiteral',
      identifier: getIdentifier(ctx.Null![0]),
      location: getLocation(ctx.Null![0])
    }
  }

  localVariableDeclaration(
    ctx: JavaParser.LocalVariableDeclarationCtx
  ): AST.LocalVariableDeclaration {
    return {
      kind: 'LocalVariableDeclaration',
      variableModifiers: ctx.variableModifier
        ? ctx.variableModifier.map(variableModifier => this.visit(variableModifier))
        : [],
      localVariableType: this.visit(ctx.localVariableType),
      variableDeclaratorList: this.visit(ctx.variableDeclaratorList),
      location: ctx.variableModifier
        ? getLocation(ctx.variableModifier[0].location)
        : getLocation(ctx.localVariableType[0].location)
    }
  }

  localVariableDeclarationStatement(
    ctx: JavaParser.LocalVariableDeclarationStatementCtx
  ): AST.LocalVariableDeclarationStatement {
    return this.visit(ctx.localVariableDeclaration)
  }

  localVariableType(ctx: JavaParser.LocalVariableTypeCtx): AST.LocalVariableType {
    if (ctx.Var) return { kind: 'Var', location: getLocation(ctx.Var[0]) }
    // if (ctx.unannType)
    return this.visit(ctx.unannType!)
  }

  methodName(ctx: JavaParser.MethodNameCtx): AST.MethodName {
    return getIdentifier(ctx.Identifier[0])
  }

  methodReferenceSuffix(ctx: JavaParser.MethodReferenceSuffixCtx): AST.New | AST.Identifier {
    if (ctx.typeArguments) throw new Error('Not implemented')
    if (ctx.New) return getIdentifier(ctx.New[0])
    // if (ctx.Identifier)
    return getIdentifier(ctx.Identifier![0])
  }

  methodBody(ctx: JavaParser.MethodBodyCtx): AST.MethodBody {
    if (ctx.block) return this.visit(ctx.block)
    throw new Error('Not implemented')
  }

  methodDeclaration(ctx: JavaParser.MethodDeclarationCtx): AST.MethodDeclaration {
    return {
      kind: 'MethodDeclaration',
      methodModifiers: ctx.methodModifier
        ? ctx.methodModifier.map(modifier => this.visit(modifier))
        : [],
      methodHeader: this.visit(ctx.methodHeader),
      methodBody: this.visit(ctx.methodBody),
      location: ctx.methodModifier
        ? getLocation(ctx.methodModifier[0].location)
        : getLocation(ctx.methodHeader[0].location)
    }
  }

  methodDeclarator(ctx: JavaParser.MethodDeclaratorCtx): AST.MethodDeclarator {
    return {
      kind: 'MethodDeclarator',
      identifier: getIdentifier(ctx.Identifier[0]),
      formalParameterList: ctx.formalParameterList ? this.visit(ctx.formalParameterList) : [],
      dims: ctx.dims ? this.visit(ctx.dims) : undefined,
      location: getLocation(ctx.Identifier[0])
    }
  }

  methodHeader(ctx: JavaParser.MethodHeaderCtx): AST.MethodHeader {
    if (ctx.annotation) throw new Error('Not implemented')
    if (ctx.typeParameters) throw new Error('Not implemented')
    return {
      kind: 'MethodHeader',
      result: this.visit(ctx.result),
      methodDeclarator: this.visit(ctx.methodDeclarator),
      throws: ctx.throws ? this.visit(ctx.throws) : [],
      location: getLocation(ctx.result[0].location)
    }
  }

  methodInvocationSuffix(
    ctx: JavaParser.MethodInvocationSuffixCtx
  ): Omit<AST.MethodInvocation, 'methodName'> {
    return {
      kind: 'MethodInvocation',
      argumentList: ctx.argumentList ? this.visit(ctx.argumentList) : undefined,
      location: getLocation(ctx.LBrace[0])
    }
  }

  methodModifier(ctx: JavaParser.MethodModifierCtx): AST.MethodModifier {
    if (ctx.annotation) throw new Error('Not implemented')
    return [
      ctx.Abstract,
      ctx.Final,
      ctx.Native,
      ctx.Private,
      ctx.Protected,
      ctx.Public,
      ctx.Static,
      ctx.Strictfp,
      ctx.Synchronized
    ]
      .filter(modifier => modifier !== undefined)
      .map(modifier => getIdentifier(modifier![0]))[0]
  }

  modularCompilationUnit(ctx: JavaParser.ModularCompilationUnitCtx) {
    throw new Error('Not implemented')
  }

  moduleDeclaration(ctx: JavaParser.ModuleDeclarationCtx) {
    throw new Error('Not implemented')
  }

  moduleDirective(ctx: JavaParser.ModuleDirectiveCtx) {
    throw new Error('Not implemented')
  }

  moduleName(ctx: JavaParser.ModuleNameCtx) {
    throw new Error('Not implemented')
  }

  newExpression(
    ctx: JavaParser.NewExpressionCtx
  ): AST.ArrayCreationExpression | AST.UnqualifiedClassInstanceCreationExpression {
    if (ctx.arrayCreationExpression) return this.visit(ctx.arrayCreationExpression)
    // if (ctx.unqualifiedClassInstanceCreationExpression)
    return this.visit(ctx.unqualifiedClassInstanceCreationExpression!)
  }

  normalClassDeclaration(ctx: JavaParser.NormalClassDeclarationCtx): AST.NormalClassDeclaration {
    if (ctx.typeParameters) throw new Error('Not implemented')
    return {
      kind: 'NormalClassDeclaration',
      classModifiers: [],
      classBody: this.visit(ctx.classBody),
      typeIdentifier: this.visit(ctx.typeIdentifier),
      classExtends: ctx.superclass ? this.visit(ctx.superclass) : undefined,
      classImplements: ctx.superinterfaces ? this.visit(ctx.superinterfaces) : undefined,
      classPermits: ctx.classPermits ? this.visit(ctx.classPermits) : undefined,
      location: getLocation(ctx.Class[0])
    }
  }

  normalInterfaceDeclaration(
    ctx: JavaParser.NormalInterfaceDeclarationCtx
  ): AST.NormalInterfaceDeclaration {
    if (ctx.typeParameters) throw new Error('Not implemented')
    return {
      kind: 'NormalInterfaceDeclaration',
      interfaceModifiers: [],
      typeIdentifier: this.visit(ctx.typeIdentifier),
      interfaceExtends: ctx.extendsInterfaces ? this.visit(ctx.extendsInterfaces) : undefined,
      interfacePermits: ctx.interfacePermits ? this.visit(ctx.interfacePermits) : undefined,
      interfaceBody: this.visit(ctx.interfaceBody),
      location: getLocation(ctx.Interface[0])
    }
  }

  numericType(ctx: JavaParser.NumericTypeCtx): AST.NumericType {
    if (ctx.floatingPointType) return this.visit(ctx.floatingPointType)
    // if (ctx.integralType)
    return this.visit(ctx.integralType!)
  }

  opensModuleDirective(ctx: JavaParser.OpensModuleDirectiveCtx) {
    throw new Error('Not implemented')
  }

  ordinaryCompilationUnit(ctx: JavaParser.OrdinaryCompilationUnitCtx): AST.OrdinaryCompilationUnit {
    if (ctx.importDeclaration) throw new Error('Not implemented')
    if (ctx.packageDeclaration) throw new Error('Not implemented')
    // if (ctx.typeDeclaration) {
    return {
      kind: 'OrdinaryCompilationUnit',
      topLevelClassOrInterfaceDeclarations: ctx.typeDeclaration!.map(typeDeclaration => {
        return this.visit(typeDeclaration)
      }),
      location: getLocation(ctx.typeDeclaration![0].location)
    }
    // }
  }

  packageDeclaration(ctx: JavaParser.PackageDeclarationCtx) {
    throw new Error('Not implemented')
  }

  packageModifier(ctx: JavaParser.PackageModifierCtx) {
    throw new Error('Not implemented')
  }

  packageName(ctx: JavaParser.PackageNameCtx) {
    throw new Error('Not implemented')
  }

  packageOrTypeName(ctx: JavaParser.PackageOrTypeNameCtx) {
    throw new Error('Not implemented')
  }

  parenthesisExpression(ctx: JavaParser.ParenthesisExpressionCtx): AST.ParenthesisExpression {
    return {
      kind: 'ParenthesisExpression',
      expression: this.visit(ctx.expression),
      location: getLocation(ctx.LBrace[0])
    }
  }

  pattern(ctx: JavaParser.PatternCtx): AST.Pattern {
    if (ctx.AndAnd) throw new Error('Not implemented')
    if (ctx.binaryExpression) throw new Error('Not implemneted')
    return this.visit(ctx.primaryPattern)
  }

  primary(ctx: JavaParser.PrimaryCtx): AST.Primary {
    const prefix = this.visit(ctx.primaryPrefix)
    const suffixes = ctx.primarySuffix ? ctx.primarySuffix.map(suffix => this.visit(suffix)) : []
    if (suffixes.length === 0) {
      if (prefix.kind === 'ExpressionName' && prefix.identifier.identifier === 'this') {
        return {
          kind: 'This',
          location: prefix.identifier.location
        }
      }
      return prefix
    }
    const firstSuffix = suffixes[0]
    if (firstSuffix.kind === 'ClassLiteral') {
      const classLiteral = { ...firstSuffix, location: prefix.location }
      if (prefix.kind === 'Identifier') classLiteral.type = prefix
      else if (prefix.kind === 'IntegralType' || prefix.kind === 'FloatingPointType')
        classLiteral.type = prefix
      else if (prefix.kind === 'Boolean') classLiteral.type = prefix
      else if (prefix.kind === 'UnannArrayType') {
        firstSuffix.dims.push(...prefix.dims.dims)
        classLiteral.type = prefix.type
      } else classLiteral.type = { kind: 'Void', location: prefix.location }
      return classLiteral
    }
    if (firstSuffix.kind === 'TypeNameThis') {
      return {
        ...firstSuffix,
        typeName: prefix
      }
    }
    if (firstSuffix.kind === 'ClassInstanceCreationExpression') {
      if (prefix.kind === 'ExpressionName') firstSuffix.expressionName = prefix
      else firstSuffix.primary = prefix
      return firstSuffix
    }
    if (firstSuffix.kind === 'ArrayAccess') {
      let currentPrefix = prefix
      for (const suffix of suffixes) {
        suffix.arrayReferenceExpression = currentPrefix
        currentPrefix = suffix
      }
      return currentPrefix
    }
    if (firstSuffix.kind === 'MethodInvocation') {
      let currentPrefix = prefix
      for (const suffix of suffixes) {
        if (currentPrefix.kind === 'Identifier') suffix.methodName = currentPrefix
        else if (currentPrefix.kind === 'FieldAccess') {
          suffix.primary = currentPrefix.primary
          suffix.methodName = currentPrefix.identifier
        } else suffix.primary = currentPrefix
        currentPrefix = suffix
      }
      return currentPrefix
    }
    if (firstSuffix.kind === 'MethodReference') {
      let currentPrefix = prefix
      for (const suffix of suffixes) {
        suffix.primary = currentPrefix
        currentPrefix = suffix
      }
      return currentPrefix
    }

    throw new Error('Not implemented')
  }

  primaryPattern(ctx: JavaParser.PrimaryPatternCtx) {
    if (ctx.LBrace) throw new Error('Not implemented')
    if (ctx.RBrace) throw new Error('Not implemented')
    if (ctx.pattern) throw new Error('Not implemented')
    if (ctx.typePattern) return this.visit(ctx.typePattern)
  }

  primaryPrefix(ctx: JavaParser.PrimaryPrefixCtx) {
    if (ctx.castExpression) return this.visit(ctx.castExpression)
    if (ctx.fqnOrRefType) return this.visit(ctx.fqnOrRefType)
    if (ctx.literal) return this.visit(ctx.literal)
    if (ctx.newExpression) return this.visit(ctx.newExpression)
    if (ctx.parenthesisExpression) return this.visit(ctx.parenthesisExpression)
    if (ctx.switchStatement) return this.visit(ctx.switchStatement)
    if (ctx.unannPrimitiveTypeWithOptionalDimsSuffix)
      return this.visit(ctx.unannPrimitiveTypeWithOptionalDimsSuffix)
    for (const keyword of [ctx.This, ctx.Void]) {
      if (!keyword) continue
      return {
        kind: 'ExpressionName',
        identifier: getIdentifier(keyword[0]),
        location: getLocation(keyword[0])
      }
    }
  }

  primarySuffix(ctx: JavaParser.PrimarySuffixCtx) {
    if (ctx.classLiteralSuffix) {
      return {
        kind: 'ClassLiteral',
        ...this.visit(ctx.classLiteralSuffix)
      }
    }
    if (ctx.methodInvocationSuffix) return this.visit(ctx.methodInvocationSuffix)
    if (ctx.methodReferenceSuffix) {
      const suffix = this.visit(ctx.methodReferenceSuffix)
      if (suffix.kind === 'New') {
        return {
          kind: 'MethodReference',
          new: suffix
        }
      }
      return {
        kind: 'MethodReference',
        identifier: suffix
      }
    }
    if (ctx.arrayAccessSuffix) return this.visit(ctx.arrayAccessSuffix)
    if (ctx.Dot && ctx.Identifier) {
      return {
        kind: 'FieldAccess',
        identifier: getIdentifier(ctx.Identifier[0]),
        location: getLocation(ctx.Identifier[0])
      }
    }
    if (ctx.Dot && ctx.This) {
      return {
        kind: 'TypeNameThis',
        this: getNode(ctx.This[0]) as AST.This,
        location: getLocation(ctx.Dot[0])
      }
    }
    if (ctx.Dot && ctx.unqualifiedClassInstanceCreationExpression) {
      return {
        kind: 'ClassInstanceCreationExpression',
        unqualifiedClassInstanceCreationExpression: this.visit(
          ctx.unqualifiedClassInstanceCreationExpression
        ),
        location: getLocation(ctx.Dot[0])
      }
    }
    throw new Error('Not implemented')
  }

  primitiveCastExpression(ctx: JavaParser.PrimitiveCastExpressionCtx): AST.CastExpression {
    return {
      kind: 'CastExpression',
      primitiveType: this.visit(ctx.primitiveType),
      unaryExpression: this.visit(ctx.unaryExpression),
      location: getLocation(ctx.LBrace[0])
    }
  }

  primitiveType(ctx: JavaParser.PrimitiveTypeCtx): AST.PrimitiveType {
    if (ctx.annotation) throw new Error('Not implemented')
    if (ctx.Boolean) return getNode(ctx.Boolean[0]) as AST.Boolean
    // if (ctx.numericType)
    return this.visit(ctx.numericType!)
  }

  providesModuleDirective(ctx: JavaParser.ProvidesModuleDirectiveCtx) {
    throw new Error('Not implemented')
  }

  qualifiedExplicitConstructorInvocation(
    ctx: JavaParser.QualifiedExplicitConstructorInvocationCtx
  ): AST.ExplicitConstructorInvocation {
    if (ctx.typeArguments) throw new Error('Not implemented')
    return {
      kind: 'ExplicitConstructorInvocation',
      expressionName: this.visit(ctx.expressionName),
      super: getNode(ctx.Super[0]) as AST.Super,
      argumentList: ctx.argumentList ? this.visit(ctx.argumentList) : [],
      location: getLocation(ctx.expressionName[0].location)
    }
  }

  receiverParameter(ctx: JavaParser.ReceiverParameterCtx): AST.ReceiverParameter {
    return {
      kind: 'ReceiverParameter',
      unannType: this.visit(ctx.unannType),
      identifier: ctx.Identifier ? getIdentifier(ctx.Identifier[0]) : undefined,
      location: getLocation(ctx.unannType[0].location)
    }
  }

  recordBody(ctx: JavaParser.RecordBodyCtx): AST.RecordBody {
    return {
      kind: 'RecordBody',
      recordBodyDeclarations: ctx.recordBodyDeclaration
        ? ctx.recordBodyDeclaration.map(recordBodyDeclaration => this.visit(recordBodyDeclaration))
        : [],
      location: getLocation(ctx.LCurly[0])
    }
  }

  recordBodyDeclaration(ctx: JavaParser.RecordBodyDeclarationCtx): AST.RecordBodyDeclaration {
    if (ctx.classBodyDeclaration) return this.visit(ctx.classBodyDeclaration)
    return this.visit(ctx.compactConstructorDeclaration!)
  }

  recordComponent(ctx: JavaParser.RecordComponentCtx): AST.RecordComponent {
    if (ctx.variableArityRecordComponent) {
      return {
        ...this.visit(ctx.variableArityRecordComponent),
        recordComponentModifiers: ctx.recordComponentModifier
          ? ctx.recordComponentModifier.map(recordComponentModifier =>
              this.visit(recordComponentModifier)
            )
          : [],
        unannType: this.visit(ctx.unannType),
        location: ctx.recordComponentModifier
          ? getLocation(ctx.recordComponentModifier[0].location)
          : getLocation(ctx.unannType[0].location)
      }
    }

    return {
      kind: 'RecordComponent',
      recordComponentModifiers: ctx.recordComponentModifier
        ? ctx.recordComponentModifier.map(recordComponentModifier =>
            this.visit(recordComponentModifier)
          )
        : [],
      unannType: this.visit(ctx.unannType),
      identifier: getIdentifier(ctx.Identifier![0]),
      location: ctx.recordComponentModifier
        ? getLocation(ctx.recordComponentModifier[0].location)
        : getLocation(ctx.unannType[0].location)
    }
  }

  recordComponentList(ctx: JavaParser.RecordComponentListCtx): AST.RecordComponentList {
    return {
      kind: 'RecordComponentList',
      recordComponents: ctx.recordComponent.map(recordComponent => this.visit(recordComponent)),
      location: getLocation(ctx.recordComponent[0].location)
    }
  }

  recordComponentModifier(ctx: JavaParser.RecordComponentModifierCtx): AST.RecordComponentModifier {
    throw new Error('Not implemented')
  }

  recordDeclaration(ctx: JavaParser.RecordDeclarationCtx): AST.RecordDeclaration {
    if (ctx.typeParameters) throw new Error('Not implemented')
    return {
      kind: 'RecordDeclaration',
      classModifiers: [],
      typeIdentifier: this.visit(ctx.typeIdentifier),
      recordHeader: this.visit(ctx.recordHeader),
      classImplements: ctx.superinterfaces ? this.visit(ctx.superinterfaces) : undefined,
      recordBody: this.visit(ctx.recordBody),
      location: getLocation(ctx.Record[0])
    }
  }

  recordHeader(ctx: JavaParser.RecordHeaderCtx): AST.RecordHeader {
    return {
      kind: 'RecordHeader',
      recordComponentList: ctx.recordComponentList
        ? this.visit(ctx.recordComponentList)
        : undefined,
      location: getLocation(ctx.LBrace[0])
    }
  }

  referenceType(ctx: JavaParser.ReferenceTypeCtx): AST.ReferenceType {
    if (ctx.annotation) throw new Error('Not implemented')
    throw new Error('Not implemented')
    // const classOrInterfaceType = ctx.classOrInterfaceType
    //   ? this.visit(ctx.classOrInterfaceType)
    //   : undefined
    // const primitiveType: AST.PrimitiveType | undefined = ctx.primitiveType
    //   ? this.visit(ctx.primitiveType)
    //   : undefined
    // if (!ctx.dims) {
    //   if (classOrInterfaceType) return classOrInterfaceType
    //   if (primitiveType!.kind === 'Boolean') {
    //     return {
    //       kind: 'Identifier',
    //       identifier: 'boolean',
    //       location: primitiveType!.location
    //     }
    //   }
    //   return primitiveType!.identifier
    // }

    // if (ctx.dims) {
    //   const lastDims = ctx.dims[ctx.dims.length - 1]
    //   ctx.dims = ctx.dims.slice(0, ctx.dims.length - 1)
    //   const referenceType = this.referenceType(ctx)
    //   const arrayType: AST.ArrayType = {
    //     kind: 'ArrayType',

    //     classOrInterfaceType: referenceType.kind === 'ClassType' ? referenceType : undefined,
    //     dims: this.visit(lastDims),
    //     location: referenceType.location
    //   }
    //   return arrayType
    // }
  }

  referenceTypeCastExpression(ctx: JavaParser.ReferenceTypeCastExpressionCtx): AST.CastExpression {
    return {
      kind: 'CastExpression',
      referenceType: this.visit(ctx.referenceType),
      lambdaExpression: ctx.lambdaExpression ? this.visit(ctx.lambdaExpression) : undefined,
      unaryExpressionNotPlusMinus: ctx.unaryExpressionNotPlusMinus
        ? this.visit(ctx.unaryExpressionNotPlusMinus)
        : undefined,
      location: getLocation(ctx.LBrace[0])
    }
  }

  regularLambdaParameter(ctx: JavaParser.RegularLambdaParameterCtx): AST.NormalLambdaParameter {
    return {
      kind: 'NormalLambdaParameter',
      variableModifiers: ctx.variableModifier
        ? ctx.variableModifier.map(variableModifier => this.visit(variableModifier))
        : [],
      lambdaParameterType: this.visit(ctx.lambdaParameterType),
      variableDeclaratorId: this.visit(ctx.variableDeclaratorId),
      location: ctx.variableModifier
        ? getLocation(ctx.variableModifier[0].location)
        : getLocation(ctx.lambdaParameterType[0].location)
    }
  }

  requiresModifier(ctx: JavaParser.RequiresModifierCtx) {
    throw new Error('Not implemented')
  }

  requiresModuleDirective(ctx: JavaParser.RequiresModuleDirectiveCtx) {
    throw new Error('Not implemented')
  }

  resource(ctx: JavaParser.ResourceCtx): AST.Resource {
    if (ctx.resourceInit) return this.visit(ctx.resourceInit)
    // if (ctx.variableAccess)
    return this.visit(ctx.variableAccess!)
  }

  resourceInit(ctx: JavaParser.ResourceInitCtx): AST.LocalVariableDeclaration {
    return {
      kind: 'LocalVariableDeclaration',
      variableModifiers: ctx.variableModifier
        ? ctx.variableModifier.map(variableModifier => this.visit(variableModifier))
        : [],
      localVariableType: this.visit(ctx.localVariableType),
      variableDeclaratorList: {
        kind: 'VariableDeclaratorList',
        variableDeclarators: [
          {
            kind: 'VariableDeclarator',
            variableDeclaratorId: {
              kind: 'VariableDeclaratorId',
              identifier: getIdentifier(ctx.Identifier[0]),
              dims: {
                kind: 'Dims',
                dims: [],
                location: getLocation(ctx.Identifier[0])
              },
              location: getLocation(ctx.Identifier[0])
            },
            variableInitializer: this.visit(ctx.expression),
            location: getLocation(ctx.Identifier[0])
          }
        ],
        location: getLocation(ctx.Identifier[0])
      },
      location: ctx.variableModifier
        ? getLocation(ctx.variableModifier[0].location)
        : getLocation(ctx.localVariableType[0].location)
    }
  }

  resourceList(ctx: JavaParser.ResourceListCtx): AST.ResourceList {
    return {
      kind: 'ResourceList',
      resources: ctx.resource.map(resource => this.visit(resource)),
      location: getLocation(ctx.resource[0].location)
    }
  }

  resourceSpecification(ctx: JavaParser.ResourceSpecificationCtx): AST.ResourceSpecification {
    return {
      kind: 'ResourceSpecification',
      resourceList: this.visit(ctx.resourceList),
      location: getLocation(ctx.LBrace[0])
    }
  }

  result(ctx: JavaParser.ResultCtx): AST.Result {
    if (ctx.unannType) return this.visit(ctx.unannType)
    // if (ctx.Void)
    return getNode(ctx.Void![0]) as AST.Void
  }

  returnStatement(ctx: JavaParser.ReturnStatementCtx): AST.ReturnStatement {
    return {
      kind: 'ReturnStatement',
      expression: ctx.expression ? this.visit(ctx.expression) : undefined,
      location: getLocation(ctx.Return[0])
    }
  }

  simpleTypeName(ctx: JavaParser.SimpleTypeNameCtx): AST.SimpleTypeName {
    return getIdentifier(ctx.Identifier[0])
  }

  statement(ctx: JavaParser.StatementCtx): AST.Statement {
    if (ctx.forStatement) return this.visit(ctx.forStatement)
    if (ctx.ifStatement) return this.visit(ctx.ifStatement)
    if (ctx.labeledStatement) return this.visit(ctx.labeledStatement)
    if (ctx.statementWithoutTrailingSubstatement)
      return this.visit(ctx.statementWithoutTrailingSubstatement)
    // if (ctx.whileStatement)
    return this.visit(ctx.whileStatement!)
  }

  statementExpression(ctx: JavaParser.StatementExpressionCtx): AST.StatementExpression {
    return this.visit(ctx.expression)
  }

  statementExpressionList(ctx: JavaParser.StatementExpressionListCtx): AST.StatementExpressionList {
    return {
      kind: 'StatementExpressionList',
      statementExpressions: ctx.statementExpression.map(statementExpression =>
        this.visit(statementExpression)
      ),
      location: getLocation(ctx.statementExpression[0].location)
    }
  }

  statementWithoutTrailingSubstatement(
    ctx: JavaParser.StatementWithoutTrailingSubstatementCtx
  ): AST.StatementWithoutTrailingSubstatement {
    if (ctx.assertStatement) return this.visit(ctx.assertStatement)
    if (ctx.block) return this.visit(ctx.block)
    if (ctx.breakStatement) return this.visit(ctx.breakStatement)
    if (ctx.continueStatement) return this.visit(ctx.continueStatement)
    if (ctx.doStatement) return this.visit(ctx.doStatement)
    if (ctx.emptyStatement) return this.visit(ctx.emptyStatement)
    if (ctx.expressionStatement) return this.visit(ctx.expressionStatement)
    if (ctx.returnStatement) return this.visit(ctx.returnStatement)
    if (ctx.switchStatement) return this.visit(ctx.switchStatement)
    if (ctx.synchronizedStatement) return this.visit(ctx.synchronizedStatement)
    if (ctx.throwStatement) return this.visit(ctx.throwStatement)
    if (ctx.tryStatement) return this.visit(ctx.tryStatement)
    // if (ctx.yieldStatement)
    return this.visit(ctx.yieldStatement!)
  }

  staticInitializer(ctx: JavaParser.StaticInitializerCtx): AST.StaticInitializer {
    return {
      kind: 'StaticInitializer',
      block: this.visit(ctx.block),
      location: getLocation(ctx.Static[0])
    }
  }

  superclass(ctx: JavaParser.SuperclassCtx): AST.ClassExtends {
    return {
      kind: 'ClassExtends',
      classType: this.visit(ctx.classType),
      location: getLocation(ctx.Extends[0])
    }
  }

  superinterfaces(ctx: JavaParser.SuperinterfacesCtx): AST.ClassImplements {
    return {
      kind: 'ClassImplements',
      interfaceTypeList: this.visit(ctx.interfaceTypeList),
      location: getLocation(ctx.Implements[0])
    }
  }

  switchBlock(ctx: JavaParser.SwitchBlockCtx): AST.SwitchBlock {
    if (ctx.switchRule) throw new Error('Not implemented')
    return {
      kind: 'SwitchBlock',
      switchBlockStatementGroups: ctx.switchBlockStatementGroup
        ? ctx.switchBlockStatementGroup.map(switchBlockStatementGroup =>
            this.visit(switchBlockStatementGroup)
          )
        : [],
      switchLabels: [],
      location: getLocation(ctx.LCurly[0])
    }
  }

  switchBlockStatementGroup(
    ctx: JavaParser.SwitchBlockStatementGroupCtx
  ): AST.SwitchBlockStatementGroup {
    return {
      kind: 'SwitchBlockStatementGroup',
      switchLabels: ctx.switchLabel.map(switchLabel => this.visit(switchLabel)),
      blockStatements: ctx.blockStatements ? this.visit(ctx.blockStatements) : undefined,
      location: getLocation(ctx.switchLabel[0].location)
    }
  }

  switchLabel(ctx: JavaParser.SwitchLabelCtx): AST.SwitchLabel {
    return this.visit(ctx.caseOrDefaultLabel)
  }

  switchRule(ctx: JavaParser.SwitchRuleCtx) {
    throw new Error('Not implemented')
  }

  switchStatement(ctx: JavaParser.SwitchStatementCtx): AST.SwitchStatement {
    return {
      kind: 'SwitchStatement',
      expression: this.visit(ctx.expression),
      switchBlock: this.visit(ctx.switchBlock),
      location: getLocation(ctx.Switch[0])
    }
  }

  synchronizedStatement(ctx: JavaParser.SynchronizedStatementCtx): AST.SynchronizedStatement {
    return {
      kind: 'SynchronizedStatement',
      expression: this.visit(ctx.expression),
      block: this.visit(ctx.block),
      location: getLocation(ctx.Synchronized[0])
    }
  }

  ternaryExpression(ctx: JavaParser.TernaryExpressionCtx): AST.ConditionalExpression {
    const binaryExpression = this.visit(ctx.binaryExpression)
    if (ctx.Colon && ctx.QuestionMark && ctx.expression) {
      return {
        kind: 'ConditionalExpression',
        conditionalExpression: binaryExpression,
        consequentExpression: this.visit(ctx.expression[0]),
        alternateExpression: this.visit(ctx.expression[1]),
        location: getLocation(ctx.binaryExpression[0].location)
      }
    }
    return binaryExpression
  }

  throwStatement(ctx: JavaParser.ThrowStatementCtx): AST.ThrowStatement {
    return {
      kind: 'ThrowStatement',
      expression: this.visit(ctx.expression),
      location: getLocation(ctx.Throw[0])
    }
  }

  throws(ctx: JavaParser.ThrowsCtx): AST.Throws {
    return {
      kind: 'Throws',
      exceptionTypeList: this.visit(ctx.exceptionTypeList),
      location: getLocation(ctx.Throws[0])
    }
  }

  tryStatement(ctx: JavaParser.TryStatementCtx): AST.TryStatement {
    if (ctx.tryWithResourcesStatement) return this.visit(ctx.tryWithResourcesStatement)
    return {
      kind: 'TryStatement',
      block: ctx.block ? this.visit(ctx.block) : undefined,
      catches: ctx.catches ? this.visit(ctx.catches) : undefined,
      finally: ctx.finally ? this.visit(ctx.finally) : undefined,
      location: getLocation(ctx.Try![0])
    }
  }

  tryWithResourcesStatement(
    ctx: JavaParser.TryWithResourcesStatementCtx
  ): AST.TryWithResourcesStatement {
    return {
      kind: 'TryWithResourcesStatement',
      resourceSpecification: this.visit(ctx.resourceSpecification),
      block: ctx.block ? this.visit(ctx.block) : undefined,
      catches: ctx.catches ? this.visit(ctx.catches) : undefined,
      finally: ctx.finally ? this.visit(ctx.finally) : undefined,
      location: getLocation(ctx.Try[0])
    }
  }

  typeArgument(ctx: JavaParser.TypeArgumentCtx) {
    throw new Error('Not implemented')
  }

  typeArgumentList(ctx: JavaParser.TypeArgumentListCtx) {
    throw new Error('Not implemented')
  }

  typeArguments(ctx: JavaParser.TypeArgumentsCtx) {
    throw new Error('Not implemented')
  }

  typeArgumentsOrDiamond(ctx: JavaParser.TypeArgumentsOrDiamondCtx) {
    throw new Error('Not implemented')
  }

  typeBound(ctx: JavaParser.TypeBoundCtx) {
    throw new Error('Not implemented')
  }

  typeDeclaration(
    ctx: JavaParser.TypeDeclarationCtx
  ): AST.InterfaceDeclaration | AST.ClassDeclaration {
    if (ctx.interfaceDeclaration) return this.visit(ctx.interfaceDeclaration)
    // if (ctx.classDeclaration)
    return this.visit(ctx.classDeclaration!)
  }

  typeIdentifier(ctx: JavaParser.TypeIdentifierCtx): AST.TypeIdentifier {
    return getIdentifier(ctx.Identifier[0])
  }

  typeName(ctx: JavaParser.TypeNameCtx): AST.TypeName {
    if (ctx.Dot) throw new Error('Not implemented')
    return getIdentifier(ctx.Identifier[0])
  }

  typePattern(ctx: JavaParser.TypePatternCtx): AST.TypePattern {
    return this.visit(ctx.localVariableDeclaration)
  }

  typeParameter(ctx: JavaParser.TypeParameterCtx) {
    throw new Error('Not implemented')
  }

  typeParameterList(ctx: JavaParser.TypeParameterListCtx) {
    throw new Error('Not implemented')
  }

  typeParameterModifier(ctx: JavaParser.TypeParameterModifierCtx) {
    throw new Error('Not implemented')
  }

  typeParameters(ctx: JavaParser.TypeParametersCtx) {
    throw new Error('Not implemented')
  }

  typeVariable(ctx: JavaParser.TypeVariableCtx): AST.TypeVariable {
    if (ctx.annotation) throw new Error('Not implemented')
    return getIdentifier(ctx.Identifier[0])
  }

  unannClassType(ctx: JavaParser.UnannClassTypeCtx): AST.UnannClassType {
    if (ctx.annotation) throw new Error('Not implemented')
    if (ctx.Dot) throw new Error('Not implemented')
    if (ctx.typeArguments) throw new Error('Not implemented')
    return {
      kind: 'UnannClassType',
      typeIdentifier: getIdentifier(ctx.Identifier[0]),
      location: getLocation(ctx.Identifier[0])
    }
  }

  unannClassOrInterfaceType(
    ctx: JavaParser.UnannClassOrInterfaceTypeCtx
  ): AST.UnannClassOrInterfaceType {
    return this.visit(ctx.unannClassType)
  }

  unannInterfaceType(ctx: JavaParser.UnannInterfaceTypeCtx): AST.UnannInterfaceType {
    return this.visit(ctx.unannClassType)
  }

  unannPrimitiveType(ctx: JavaParser.UnannPrimitiveTypeCtx): AST.UnannPrimitiveType {
    if (ctx.numericType) return this.visit(ctx.numericType)
    // if (ctx.Boolean) {
    return {
      kind: 'Boolean',
      location: getLocation(ctx.Boolean![0])
    }
    // }
  }

  unannPrimitiveTypeWithOptionalDimsSuffix(
    ctx: JavaParser.UnannPrimitiveTypeWithOptionalDimsSuffixCtx
  ): AST.UnannArrayType | AST.UnannPrimitiveType {
    const unannPrimitiveType = this.visit(ctx.unannPrimitiveType)
    if (ctx.dims) {
      const unannArrayType: AST.UnannArrayType = {
        kind: 'UnannArrayType',
        type: unannPrimitiveType,
        dims: this.visit(ctx.dims),
        location: getLocation(ctx.unannPrimitiveType[0].location)
      }
      return unannArrayType
    }
    return unannPrimitiveType
  }

  unannReferenceType(
    ctx: JavaParser.UnannReferenceTypeCtx
  ): AST.UnannArrayType | AST.UnannClassOrInterfaceType {
    const unannClassOrInterfaceType = this.visit(
      ctx.unannClassOrInterfaceType
    ) as AST.UnannClassOrInterfaceType
    if (ctx.dims) {
      return {
        kind: 'UnannArrayType',
        dims: this.visit(ctx.dims),
        type: unannClassOrInterfaceType,
        location: getLocation(ctx.unannClassOrInterfaceType[0].location)
      }
    }
    return unannClassOrInterfaceType
  }

  unannType(ctx: JavaParser.UnannTypeCtx): AST.UnannType {
    if (ctx.unannPrimitiveTypeWithOptionalDimsSuffix)
      return this.visit(ctx.unannPrimitiveTypeWithOptionalDimsSuffix)
    // if (ctx.unannReferenceType)
    return this.visit(ctx.unannReferenceType!)
  }

  unannTypeVariable(ctx: JavaParser.UnannTypeVariableCtx): AST.UnannTypeVariable {
    return getIdentifier(ctx.Identifier[0])
  }

  unaryExpression(ctx: JavaParser.UnaryExpressionCtx): AST.UnaryExpression {
    const primary = this.visit(ctx.primary)
    if (ctx.UnaryPrefixOperator) {
      return {
        kind: 'UnaryExpression',
        prefixOperator: getIdentifier(ctx.UnaryPrefixOperator[0]),
        unaryExpression: primary,
        location: getLocation(ctx.UnaryPrefixOperator[0])
      }
    }

    if (ctx.UnarySuffixOperator) {
      return {
        kind: 'PostfixExpression',
        postfixOperator: getIdentifier(ctx.UnarySuffixOperator[0]),
        postfixExpression: primary,
        location: getLocation(ctx.primary[0].location)
      }
    }

    return primary
  }

  unaryExpressionNotPlusMinus(
    ctx: JavaParser.UnaryExpressionNotPlusMinusCtx
  ): AST.UnaryExpressionNotPlusMinus {
    const primary = this.visit(ctx.primary)
    if (ctx.UnaryPrefixOperatorNotPlusMinus) {
      return {
        kind: 'UnaryExpressionNotPlusMinus',
        prefixOperator: getIdentifier(ctx.UnaryPrefixOperatorNotPlusMinus[0]),
        unaryExpression: primary,
        location: getLocation(ctx.UnaryPrefixOperatorNotPlusMinus[0])
      }
    }
    if (ctx.UnarySuffixOperator) {
      return {
        kind: 'PostfixExpression',
        postfixOperator: getIdentifier(ctx.UnarySuffixOperator[0]),
        postfixExpression: primary,
        location: getLocation(ctx.primary[0].location)
      }
    }
    return primary
  }

  unqualifiedClassInstanceCreationExpression(
    ctx: JavaParser.UnqualifiedClassInstanceCreationExpressionCtx
  ): AST.UnqualifiedClassInstanceCreationExpression {
    if (ctx.typeArguments) throw new Error('Not implemented')
    return {
      kind: 'UnqualifiedClassInstanceCreationExpression',
      classOrInterfaceTypeToInstantiate: this.visit(ctx.classOrInterfaceTypeToInstantiate),
      argumentList: ctx.argumentList ? this.visit(ctx.argumentList) : undefined,
      classBody: ctx.classBody ? this.visit(ctx.classBody) : undefined,
      location: getLocation(ctx.New[0])
    }
  }

  unqualifiedExplicitConstructorInvocation(
    ctx: JavaParser.UnqualifiedExplicitConstructorInvocationCtx
  ): AST.ExplicitConstructorInvocation {
    if (ctx.typeArguments) throw new Error('Not implemented')
    return {
      kind: 'ExplicitConstructorInvocation',
      super: ctx.Super ? (getNode(ctx.Super[0]) as AST.Super) : undefined,
      this: ctx.This ? (getNode(ctx.This[0]) as AST.This) : undefined,
      argumentList: ctx.argumentList ? this.visit(ctx.argumentList) : [],
      location: getLocation(ctx.LBrace[0])
    }
  }

  usesModuleDirective(ctx: JavaParser.UsesModuleDirectiveCtx) {
    throw new Error('Not implemented')
  }

  variableAccess(ctx: JavaParser.VariableAccessCtx): AST.VariableAccess {
    return this.visit(ctx.primary)
  }

  variableArityParameter(ctx: JavaParser.VariableArityParameterCtx): AST.VariableArityParameter {
    if (ctx.annotation) throw new Error('Not implemented')
    const variableModifiers = ctx.variableModifier ? this.visit(ctx.variableModifier) : []
    return {
      kind: 'VariableArityParameter',
      variableModifiers,
      unannType: this.visit(ctx.unannType),
      identifier: getIdentifier(ctx.Identifier[0]),
      location: ctx.variableModifier
        ? getLocation(ctx.variableModifier[0].location)
        : getLocation(ctx.unannType[0].location)
    }
  }

  variableArityRecordComponent(
    ctx: JavaParser.VariableArityRecordComponentCtx
  ): Pick<AST.VariableArityRecordComponent, 'kind' | 'identifier' | 'location'> {
    return {
      kind: 'VariableArityRecordComponent',
      identifier: getIdentifier(ctx.Identifier[0]),
      location: getLocation(ctx.DotDotDot[0])
    }
  }

  variableDeclarator(ctx: JavaParser.VariableDeclaratorCtx): AST.VariableDeclarator {
    return {
      kind: 'VariableDeclarator',
      variableDeclaratorId: this.visit(ctx.variableDeclaratorId),
      variableInitializer: ctx.variableInitializer
        ? this.visit(ctx.variableInitializer)
        : undefined,
      location: getLocation(ctx.variableDeclaratorId[0].location)
    }
  }

  variableDeclaratorId(ctx: JavaParser.VariableDeclaratorIdCtx): AST.VariableDeclaratorId {
    return {
      kind: 'VariableDeclaratorId',
      identifier: getIdentifier(ctx.Identifier[0]),
      dims: ctx.dims ? this.visit(ctx.dims) : undefined,
      location: getLocation(ctx.Identifier[0])
    }
  }

  variableDeclaratorList(ctx: JavaParser.VariableDeclaratorListCtx): AST.VariableDeclaratorList {
    return {
      kind: 'VariableDeclaratorList',
      variableDeclarators: ctx.variableDeclarator.map(declarator => this.visit(declarator)),
      location: getLocation(ctx.variableDeclarator[0].location)
    }
  }

  variableInitializer(ctx: JavaParser.VariableInitializerCtx): AST.VariableInitializer {
    if (ctx.arrayInitializer) return this.visit(ctx.arrayInitializer)
    // if (ctx.expression)
    return this.visit(ctx.expression!)
  }

  variableInitializerList(ctx: JavaParser.VariableInitializerListCtx): AST.VariableInitializerList {
    return {
      kind: 'VariableInitializerList',
      variableInitializers: ctx.variableInitializer.map(variableInitializer =>
        this.visit(variableInitializer)
      ),
      location: getLocation(ctx.variableInitializer[0].location)
    }
  }

  variableModifier(ctx: JavaParser.VariableModifierCtx): AST.VariableModifier {
    if (ctx.annotation) throw new Error('Not implemented')
    // if (ctx.Final)
    return getIdentifier(ctx.Final![0])
  }

  variableParaRegularParameter(
    ctx: JavaParser.VariableParaRegularParameterCtx
  ): AST.FormalParameter {
    const variableModifiers = ctx.variableModifier ? this.visit(ctx.variableModifier) : []
    return {
      kind: 'FormalParameter',
      variableModifiers,
      unannType: this.visit(ctx.unannType),
      variableDeclaratorId: this.visit(ctx.variableDeclaratorId),
      location: ctx.variableModifier
        ? getLocation(ctx.variableModifier[0].location)
        : getLocation(ctx.unannType[0].location)
    }
  }

  whileStatement(ctx: JavaParser.WhileStatementCtx): AST.WhileStatement {
    return {
      kind: 'WhileStatement',
      expression: this.visit(ctx.expression),
      statement: this.visit(ctx.statement),
      location: getLocation(ctx.While[0])
    }
  }

  wildcard(ctx: JavaParser.WildcardCtx) {
    throw new Error('Not implemented')
  }

  wildcardBounds(ctx: JavaParser.WildcardBoundsCtx) {
    throw new Error('Not implemented')
  }

  yieldStatement(ctx: JavaParser.YieldStatementCtx): AST.YieldStatement {
    return {
      kind: 'YieldStatement',
      expression: this.visit(ctx.expression),
      location: getLocation(ctx.Yield[0])
    }
  }
}

export default AstExtractor

/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseJavaCstVisitor, default as JavaParser } from 'java-parser'
import { getIdentifier, getLocation } from './utils'

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

  ambiguousName(ctx: JavaParser.AmbiguousNameCtx) {
    throw new Error('Not implemented')
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

  argumentList(ctx: JavaParser.ArgumentListCtx) {
    return {
      expressions: ctx.expression.map(expression => this.visit(expression)),
      location: getLocation(ctx.expression[0].location)
    }
  }

  arrayAccessSuffix(ctx: JavaParser.ArrayAccessSuffixCtx) {
    return {
      kind: 'ArrayAccess',
      expression: this.visit(ctx.expression),
      location: getLocation(ctx.LSquare[0])
    }
  }

  arrayCreationDefaultInitSuffix(ctx: JavaParser.ArrayCreationDefaultInitSuffixCtx) {
    return {
      dimExprs: this.visit(ctx.dimExprs),
      dims: ctx.dims ? this.visit(ctx.dims) : undefined,
      location: getLocation(ctx.dimExprs[0].location)
    }
  }

  arrayCreationExplicitInitSuffix(ctx: JavaParser.ArrayCreationExplicitInitSuffixCtx) {
    return {
      arrayInitializer: this.visit(ctx.arrayInitializer),
      dims: this.visit(ctx.dims),
      location: getLocation(ctx.dims[0].location)
    }
  }

  arrayCreationExpression(ctx: JavaParser.ArrayCreationExpressionCtx) {
    const result: Record<string, any> = { location: getLocation(ctx.New[0]) }
    if (ctx.classOrInterfaceType) result.type = this.visit(ctx.classOrInterfaceType)
    if (ctx.primitiveType) result.type = this.visit(ctx.primitiveType)

    if (ctx.arrayCreationDefaultInitSuffix) {
      return {
        kind: 'ArrayCreationExpressionWithoutInitializer',
        ...result,
        ...this.visit(ctx.arrayCreationDefaultInitSuffix)
      }
    } else if (ctx.arrayCreationExplicitInitSuffix) {
      return {
        kind: 'ArrayCreationExpressionWithoutInitializer',
        ...result,
        ...this.visit(ctx.arrayCreationExplicitInitSuffix)
      }
    }
  }

  arrayInitializer(ctx: JavaParser.ArrayInitializerCtx) {
    if (ctx.variableInitializerList) {
      return {
        variableInitializerList: this.visit(ctx.variableInitializerList),
        locaton: getLocation(ctx.LCurly[0])
      }
    }
  }

  assertStatement(ctx: JavaParser.AssertStatementCtx) {
    throw new Error('Not implemented')
  }

  basicForStatement(ctx: JavaParser.BasicForStatementCtx) {
    return {
      kind: 'BasicForStatement',
      forInit: ctx.forInit ? this.visit(ctx.forInit) : [],
      condition: this.visit(ctx.expression![0]),
      forUpdate: ctx.forUpdate ? this.visit(ctx.forUpdate) : [],
      body: this.visit(ctx.statement[0]),
      location: getLocation(ctx.For[0])
    }
  }

  // @ts-expect-error ts(7023)
  binaryExpression(ctx: JavaParser.BinaryExpressionCtx) {
    if (ctx.AssignmentOperator && ctx.expression) {
      return {
        kind: 'Assignment',
        leftHandSide: this.visit(ctx.unaryExpression),
        assignmentOperator: getIdentifier(ctx.AssignmentOperator[0]),
        rightHandSide: this.visit(ctx.expression),
        location: getLocation(ctx.unaryExpression[0].location)
      }
    }

    if (ctx.BinaryOperator && ctx.BinaryOperator.length > 0 && ctx.unaryExpression) {
      for (const operatorGroup of BINARY_OPERATORS) {
        const numBinaryOperators = ctx.BinaryOperator.length
        // Grouping binary operations from back to front
        for (let i = numBinaryOperators - 1; i >= 0; i--) {
          const binaryOperator = ctx.BinaryOperator[i].image
          if (!operatorGroup.includes(binaryOperator)) continue
          return {
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

  block(ctx: JavaParser.BlockCtx) {
    return {
      kind: 'Block',
      blockStatements: ctx.blockStatements ? this.visit(ctx.blockStatements) : [],
      location: getLocation(ctx.LCurly[0])
    }
  }

  blockStatement(ctx: JavaParser.BlockStatementCtx) {
    if (ctx.interfaceDeclaration) throw new Error('Not implemented')
    if (ctx.classDeclaration) return this.visit(ctx.classDeclaration)
    if (ctx.localVariableDeclarationStatement)
      return this.visit(ctx.localVariableDeclarationStatement)
    if (ctx.statement) return this.visit(ctx.statement)
  }

  blockStatements(ctx: JavaParser.BlockStatementsCtx) {
    return ctx.blockStatement.map(blockStatement => this.visit(blockStatement))
  }

  booleanLiteral(ctx: JavaParser.BooleanLiteralCtx) {
    return [ctx.False, ctx.True]
      .filter(booleanLiteral => booleanLiteral !== undefined)
      .map(booleanLiteral => ({
        kind: 'BooleanLiteral',
        identifier: getIdentifier(booleanLiteral![0]),
        location: getLocation(booleanLiteral![0])
      }))[0]
  }

  breakStatement(ctx: JavaParser.BreakStatementCtx) {
    return {
      kind: 'BreakStatement',
      identifier: ctx.Identifier ? getIdentifier(ctx.Identifier[0]) : undefined,
      location: getLocation(ctx.Break[0])
    }
  }

  caseConstant(ctx: JavaParser.CaseConstantCtx) {
    return this.visit(ctx.ternaryExpression)
  }

  caseLabelElement(ctx: JavaParser.CaseLabelElementCtx) {
    if (ctx.caseConstant) return this.visit(ctx.caseConstant)
    if (ctx.pattern) return this.visit(ctx.pattern)
    return [ctx.Default, ctx.Null]
      .filter(caseLabelElement => caseLabelElement !== undefined)
      .map(caseLabelElement => getIdentifier(caseLabelElement![0]))[0]
  }

  caseOrDefaultLabel(ctx: JavaParser.CaseOrDefaultLabelCtx) {
    if (ctx.Default) return getIdentifier(ctx.Default[0])
    if (ctx.Case && ctx.caseLabelElement) {
      return {
        kind: 'SwitchLabel',
        caseLabels: ctx.caseLabelElement.map(caseLabelElement => this.visit(caseLabelElement)),
        location: getLocation(ctx.Case[0])
      }
    }
  }

  castExpression(ctx: JavaParser.CastExpressionCtx) {
    if (ctx.primitiveCastExpression) return this.visit(ctx.primitiveCastExpression)
    if (ctx.referenceTypeCastExpression) return this.visit(ctx.referenceTypeCastExpression)
  }

  catchClause(ctx: JavaParser.CatchClauseCtx) {
    return {
      kind: 'CatchClause',
      catchFormalParameter: this.visit(ctx.catchFormalParameter),
      block: this.visit(ctx.block),
      location: getLocation(ctx.Catch[0])
    }
  }

  catchFormalParameter(ctx: JavaParser.CatchFormalParameterCtx, param?: any) {
    return {
      kind: 'CatchFormalParameter',
      variableModifier: ctx.variableModifier ? this.visit(ctx.variableModifier) : undefined,
      catchType: this.visit(ctx.catchType),
      variableDeclaratorId: this.visit(ctx.variableDeclaratorId),
      location: ctx.variableModifier
        ? getLocation(ctx.variableModifier[0].location)
        : getLocation(ctx.catchType[0].location)
    }
  }

  catchType(ctx: JavaParser.CatchTypeCtx) {
    return {
      kind: 'CatchType',
      unannClassType: this.visit(ctx.unannClassType),
      classTypes: ctx.classType ? ctx.classType.map(classType => this.visit(classType)) : [],
      location: getLocation(ctx.unannClassType[0].location)
    }
  }

  catches(ctx: JavaParser.CatchesCtx) {
    return ctx.catchClause.map(catchClause => this.visit(catchClause))
  }

  classBody(ctx: JavaParser.ClassBodyCtx) {
    const result: Record<string, any> = {
      kind: 'ClassBody',
      location: getLocation(ctx.LCurly[0])
    }
    if (ctx.classBodyDeclaration) {
      result.classBodyDeclarations = ctx.classBodyDeclaration.map(declaration => {
        return this.visit(declaration)
      })
    }
    return result
  }

  classBodyDeclaration(ctx: JavaParser.ClassBodyDeclarationCtx) {
    if (ctx.classMemberDeclaration) return this.visit(ctx.classMemberDeclaration)
    if (ctx.constructorDeclaration) return this.visit(ctx.constructorDeclaration)
    if (ctx.instanceInitializer) return this.visit(ctx.instanceInitializer)
    if (ctx.staticInitializer) return this.visit(ctx.staticInitializer)
  }

  classDeclaration(ctx: JavaParser.ClassDeclarationCtx) {
    if (ctx.enumDeclaration) return this.visit(ctx.enumDeclaration)
    const classModifiers = ctx.classModifier ? this.visit(ctx.classModifier) : []
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

  classLiteralSuffix(ctx: JavaParser.ClassLiteralSuffixCtx) {
    return {
      hasDims: !!ctx.LSquare,
      identifier: getIdentifier(ctx.Class[0])
    }
  }

  classMemberDeclaration(ctx: JavaParser.ClassMemberDeclarationCtx) {
    if (ctx.classDeclaration) return this.visit(ctx.classDeclaration)
    if (ctx.fieldDeclaration) return this.visit(ctx.fieldDeclaration)
    if (ctx.interfaceDeclaration) return this.visit(ctx.interfaceDeclaration)
    if (ctx.methodDeclaration) return this.visit(ctx.methodDeclaration)
  }

  classModifier(ctx: JavaParser.ClassModifierCtx) {
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
      .map(modifier => ({
        kind: 'ClassModifier',
        value: modifier![0].image,
        location: getLocation(modifier![0])
      }))
  }

  classOrInterfaceType(ctx: JavaParser.ClassOrInterfaceTypeCtx) {
    return this.visit(ctx.classType)
  }

  classOrInterfaceTypeToInstantiate(ctx: JavaParser.ClassOrInterfaceTypeToInstantiateCtx) {
    if (ctx.annotation) throw new Error('Not implemented')
    if (ctx.typeArgumentsOrDiamond) throw new Error('Not implemented')
    return getIdentifier(ctx.Identifier[0])
  }

  classPermits(ctx: JavaParser.ClassPermitsCtx, param?: any) {
    return {
      kind: 'ClassPermits',
      typeNames: ctx.typeName.map(typeName => this.visit(typeName)),
      location: getLocation(ctx.Permits[0])
    }
  }

  classType(ctx: JavaParser.ClassTypeCtx) {
    if (ctx.annotation) throw new Error('Not implemented')
    if (ctx.typeArguments) throw new Error('Not implemented')
    return {
      kind: 'ClassType',
      identifier: getIdentifier(ctx.Identifier[0]),
      location: getLocation(ctx.Identifier[0])
    }
  }

  compactConstructorDeclaration(ctx: JavaParser.CompactConstructorDeclarationCtx) {
    return {
      kind: 'CompactConstructorDeclaration',
      constructorModifier: ctx.constructorModifier
        ? this.visit(ctx.constructorModifier)
        : undefined,
      simpleTypeName: this.visit(ctx.simpleTypeName),
      constructorBody: this.visit(ctx.constructorBody),
      location: ctx.constructorModifier
        ? getLocation(ctx.constructorModifier[0].location)
        : getLocation(ctx.simpleTypeName[0].location)
    }
  }

  compilationUnit(ctx: JavaParser.CompilationUnitCtx) {
    // @ts-expect-error ts(2339)
    if (ctx.ordinaryCompilationUnit) return this.visit(ctx.ordinaryCompilationUnit)
    throw new Error('Not implemented')
  }

  continueStatement(ctx: JavaParser.ContinueStatementCtx) {
    return {
      kind: 'ContinueStatement',
      identifier: ctx.Identifier ? getIdentifier(ctx.Identifier[0]) : undefined,
      location: getLocation(ctx.Continue[0])
    }
  }

  constantDeclaration(ctx: JavaParser.ConstantDeclarationCtx) {
    return {
      kind: 'ConstantDeclaration',
      constantModifiers: ctx.constantModifier
        ? ctx.constantModifier.map(constantModifier => this.visit(constantModifier))
        : [],
      unannType: this.visit(ctx.unannType),
      variabledeclaratorList: this.visit(ctx.variableDeclaratorList),
      location: ctx.constantModifier
        ? getLocation(ctx.constantModifier[0].location)
        : getLocation(ctx.unannType[0].location)
    }
  }

  constantModifier(ctx: JavaParser.ConstantModifierCtx) {
    if (ctx.annotation) throw new Error('Not implemented')
    return [ctx.Final, ctx.Public, ctx.Static]
      .filter(constantModifier => constantModifier !== undefined)
      .map(constantModifier => ({
        kind: 'ConstantModifier',
        identifier: getIdentifier(constantModifier![0]),
        location: getLocation(constantModifier![0])
      }))[0]
  }

  constructorBody(ctx: JavaParser.ConstructorBodyCtx) {
    const result: Record<string, any> = {
      kind: 'ConstructorBody',
      blockStatements: ctx.blockStatements ? this.visit(ctx.blockStatements) : [],
      location: getLocation(ctx.LCurly[0])
    }
    if (ctx.explicitConstructorInvocation)
      result.explicitConstructorInvocation = this.visit(ctx.explicitConstructorInvocation)
    return result
  }

  constructorDeclaration(ctx: JavaParser.ConstructorDeclarationCtx) {
    return {
      kind: 'ConstructorDeclaration',
      constructorModifier: ctx.constructorModifier
        ? this.visit(ctx.constructorModifier)
        : undefined,
      constructorDeclarator: this.visit(ctx.constructorDeclarator),
      throws: ctx.throws ? this.visit(ctx.throws) : [],
      constructorBody: this.visit(ctx.constructorBody),
      location: ctx.constructorModifier
        ? getLocation(ctx.constructorModifier[0].location)
        : getLocation(ctx.constructorDeclarator[0].location)
    }
  }

  constructorDeclarator(ctx: JavaParser.ConstructorDeclaratorCtx) {
    if (ctx.typeParameters) throw new Error('Not implemented')
    const result: Record<string, any> = {
      kind: 'ConstructorDeclarator',
      simpleTypeName: this.visit(ctx.simpleTypeName),
      location: getLocation(ctx.simpleTypeName[0].location)
    }
    if (ctx.formalParameterList) result.formalParameterList = this.visit(ctx.formalParameterList)
    if (ctx.receiverParameter) result.receiverParameter = this.visit(ctx.receiverParameter)
    return result
  }

  constructorModifier(ctx: JavaParser.ConstructorModifierCtx) {
    if (ctx.annotation) throw new Error('Not implemented')
    return [ctx.Private, ctx.Protected, ctx.Public]
      .filter(constructorModifier => constructorModifier !== undefined)
      .map(constructorModifier => ({
        kind: 'ConstructorModifier',
        identifier: getIdentifier(constructorModifier![0]),
        location: getLocation(constructorModifier![0])
      }))[0]
  }

  defaultValue(ctx: JavaParser.DefaultValueCtx) {
    throw new Error('Not implemented')
  }

  diamond(ctx: JavaParser.DiamondCtx) {
    throw new Error('Not implemented')
  }

  dimExpr(ctx: JavaParser.DimExprCtx) {
    if (ctx.annotation) throw new Error('Not implemented')
    return {
      kind: 'DimExpr',
      expression: this.visit(ctx.expression),
      location: getLocation(ctx.LSquare[0])
    }
  }

  dimExprs(ctx: JavaParser.DimExprsCtx) {
    return ctx.dimExpr.map(dimExpr => this.visit(dimExpr))
  }

  dims(ctx: JavaParser.DimsCtx) {
    if (ctx.annotation) throw new Error('Not implemented')
    return { kind: 'Dims', value: ctx.LSquare.length }
  }

  doStatement(ctx: JavaParser.DoStatementCtx) {
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

  emptyStatement(ctx: JavaParser.EmptyStatementCtx) {
    return {
      kind: 'EmptyStatement',
      location: getLocation(ctx.Semicolon[0])
    }
  }

  enhancedForStatement(ctx: JavaParser.EnhancedForStatementCtx) {
    return {
      kind: 'EnhancedForStatement',
      localVariableType: this.visit(ctx.localVariableType),
      variableDeclaratorId: this.visit(ctx.variableDeclaratorId),
      expression: this.visit(ctx.expression),
      statement: this.visit(ctx.statement),
      location: getLocation(ctx.For[0])
    }
  }

  enumBody(ctx: JavaParser.EnumBodyCtx) {
    return {
      kind: 'EnumBody',
      enumConstantList: ctx.enumConstantList ? this.visit(ctx.enumConstantList) : [],
      enumBodyDeclarations: ctx.enumBodyDeclarations ? this.visit(ctx.enumBodyDeclarations) : [],
      location: getLocation(ctx.LCurly[0])
    }
  }

  enumBodyDeclarations(ctx: JavaParser.EnumBodyDeclarationsCtx) {
    return {
      kind: 'EnumBodyDeclaration',
      classBodyDeclaration: ctx.classBodyDeclaration
        ? this.visit(ctx.classBodyDeclaration)
        : undefined,
      location: getLocation(ctx.Semicolon[0])
    }
  }

  enumConstant(ctx: JavaParser.EnumConstantCtx) {
    return {
      kind: 'EnumConstant',
      enumConstantModifier: ctx.enumConstantModifier
        ? this.visit(ctx.enumConstantModifier)
        : undefined,
      identifier: getIdentifier(ctx.Identifier[0]),
      argumentList: ctx.argumentList ? this.visit(ctx.argumentList) : undefined,
      classBody: ctx.classBody ? this.visit(ctx.classBody) : undefined,
      location: ctx.enumConstantModifier
        ? getLocation(ctx.enumConstantModifier[0].location)
        : getLocation(ctx.Identifier[0])
    }
  }

  enumConstantList(ctx: JavaParser.EnumConstantListCtx) {
    return ctx.enumConstant.map(enumConstant => this.visit(enumConstant))
  }

  enumConstantModifier(ctx: JavaParser.EnumConstantModifierCtx) {
    throw new Error('Not implemented')
  }

  enumDeclaration(ctx: JavaParser.EnumDeclarationCtx) {
    return {
      kind: 'EnumDeclaration',
      classModifier: ctx.classModifier ? this.visit(ctx.classModifier) : undefined,
      typeIdentifier: this.visit(ctx.typeIdentifier),
      classImplements: ctx.superinterfaces ? this.visit(ctx.superinterfaces) : undefined,
      enumBody: this.visit(ctx.enumBody),
      location: ctx.classModifier
        ? getLocation(ctx.classModifier[0].location)
        : getLocation(ctx.Enum[0])
    }
  }

  exceptionType(ctx: JavaParser.ExceptionTypeCtx) {
    return this.visit(ctx.classType)
  }

  exceptionTypeList(ctx: JavaParser.ExceptionTypeListCtx, param?: any) {
    return ctx.exceptionType.map(exceptionType => this.visit(exceptionType))
  }

  explicitConstructorInvocation(ctx: JavaParser.ExplicitConstructorInvocationCtx) {
    if (ctx.qualifiedExplicitConstructorInvocation)
      return this.visit(ctx.qualifiedExplicitConstructorInvocation)
    if (ctx.unqualifiedExplicitConstructorInvocation)
      return this.visit(ctx.unqualifiedExplicitConstructorInvocation)
  }

  explicitLambdaParameterList(ctx: JavaParser.ExplicitLambdaParameterListCtx) {
    return ctx.lambdaParameter.map(lambdaParameter => this.visit(lambdaParameter))
  }

  exportsModuleDirective(ctx: JavaParser.ExportsModuleDirectiveCtx) {
    throw new Error('Not implemented')
  }

  expression(ctx: JavaParser.ExpressionCtx) {
    if (ctx.lambdaExpression) return this.visit(ctx.lambdaExpression)
    if (ctx.ternaryExpression) return this.visit(ctx.ternaryExpression)
  }

  expressionName(ctx: JavaParser.ExpressionNameCtx) {
    if (ctx.Dot) throw new Error('Not implemented')
    return {
      kind: 'ExpressionName',
      identifier: getIdentifier(ctx.Identifier[0]),
      location: getLocation(ctx.Identifier[0])
    }
  }

  expressionStatement(ctx: JavaParser.ExpressionStatementCtx) {
    return this.visit(ctx.statementExpression)
  }

  extendsInterfaces(ctx: JavaParser.ExtendsInterfacesCtx) {
    return {
      kind: 'InterfaceExtends',
      interfaceTypeList: this.visit(ctx.interfaceTypeList),
      location: getLocation(ctx.Extends[0])
    }
  }

  fieldDeclaration(ctx: JavaParser.FieldDeclarationCtx) {
    const fieldModifiers = ctx.fieldModifier ? this.visit(ctx.fieldModifier) : []
    return {
      kind: 'FieldDeclaration',
      fieldModifiers,
      unannType: this.visit(ctx.unannType),
      variableDeclaratorList: this.visit(ctx.variableDeclaratorList),
      location: ctx.fieldModifier
        ? getLocation(ctx.fieldModifier[0].location)
        : getLocation(ctx.unannType[0].location)
    }
  }

  fieldModifier(ctx: JavaParser.FieldModifierCtx) {
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
      .map(modifier => ({
        kind: 'FieldModifier',
        value: modifier![0].image,
        location: getLocation(modifier![0])
      }))
  }

  finally(ctx: JavaParser.FinallyCtx) {
    return {
      kind: 'Finally',
      block: this.visit(ctx.block),
      location: getLocation(ctx.Finally[0])
    }
  }

  floatingPointLiteral(ctx: JavaParser.FloatingPointLiteralCtx) {
    return [ctx.FloatLiteral, ctx.HexFloatLiteral]
      .filter(floatingPointLiteral => floatingPointLiteral !== undefined)
      .map(floatingPointLiteral => ({
        kind: 'FloatingPointLiteral',
        identifier: getIdentifier(floatingPointLiteral![0]),
        location: getLocation(floatingPointLiteral![0])
      }))[0]
  }

  floatingPointType(ctx: JavaParser.FloatingPointTypeCtx) {
    return [ctx.Double, ctx.Float]
      .filter(floatingPointType => floatingPointType !== undefined)
      .map(floatingPointType => ({
        kind: 'FloatingPointType',
        identifier: getIdentifier(floatingPointType![0]),
        location: getLocation(floatingPointType![0])
      }))[0]
  }

  forInit(ctx: JavaParser.ForInitCtx) {
    if (ctx.localVariableDeclaration) return this.visit(ctx.localVariableDeclaration)
    if (ctx.statementExpressionList) return this.visit(ctx.statementExpressionList)
  }

  formalParameter(ctx: JavaParser.FormalParameterCtx) {
    if (ctx.variableArityParameter) return this.visit(ctx.variableArityParameter)
    if (ctx.variableParaRegularParameter) return this.visit(ctx.variableParaRegularParameter)
  }

  formalParameterList(ctx: JavaParser.FormalParameterListCtx) {
    return ctx.formalParameter.map(formalParameter => this.visit(formalParameter))
  }

  forStatement(ctx: JavaParser.ForStatementCtx) {
    if (ctx.basicForStatement) return this.visit(ctx.basicForStatement)
    if (ctx.enhancedForStatement) return this.visit(ctx.enhancedForStatement)
  }

  forUpdate(ctx: JavaParser.ForUpdateCtx) {
    return this.visit(ctx.statementExpressionList)
  }

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
    if (ctx.Dot && ctx.Dot.length > 0) throw new Error('Not implemented')
    if (ctx.dims) throw new Error('Not implemented')
    if (ctx.fqnOrRefTypePartRest && ctx.fqnOrRefTypePartRest.length > 0)
      throw new Error('Not implemented')
    return this.visit(ctx.fqnOrRefTypePartFirst)
  }

  fqnOrRefTypePartCommon(ctx: JavaParser.FqnOrRefTypePartCommonCtx) {
    if (ctx.typeArguments) throw new Error('Not implemented')
    return [ctx.Identifier, ctx.Super]
      .filter(fqnOrRefType => fqnOrRefType !== undefined)
      .map(fqnOrRefType => ({
        kind: 'Type',
        identifier: getIdentifier(fqnOrRefType![0]),
        location: getLocation(fqnOrRefType![0])
      }))[0]
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

  ifStatement(ctx: JavaParser.IfStatementCtx) {
    const consequentStatements: JavaParser.StatementCstNode[] = []
    const alternateStatements: JavaParser.StatementCstNode[] = []
    ctx.statement.forEach(statement => {
      if (!ctx.Else) consequentStatements.push(statement)
      else
        statement.location.startOffset > ctx.Else[0].endOffset
          ? alternateStatements.push(statement)
          : consequentStatements.push(statement)
    })
    return {
      kind: 'IfStatement',
      expression: this.visit(ctx.expression),
      consequentStatement:
        consequentStatements.length > 0 ? this.visit(consequentStatements) : undefined,
      alternateStatement:
        alternateStatements.length > 0 ? this.visit(alternateStatements) : undefined
    }
  }

  importDeclaration(ctx: JavaParser.ImportDeclarationCtx) {
    throw new Error('Not implemented')
  }

  inferredLambdaParameterList(ctx: JavaParser.InferredLambdaParameterListCtx) {
    return ctx.Identifier.map(identifier => getIdentifier(identifier))
  }

  instanceInitializer(ctx: JavaParser.InstanceInitializerCtx) {
    return this.visit(ctx.block)
  }

  integerLiteral(ctx: JavaParser.IntegerLiteralCtx) {
    return [ctx.BinaryLiteral, ctx.DecimalLiteral, ctx.HexLiteral, ctx.OctalLiteral]
      .filter(integerLiteral => integerLiteral !== undefined)
      .map(integerLiteral => ({
        kind: 'IntegerLiteral',
        identifier: getIdentifier(integerLiteral![0]),
        location: getLocation(integerLiteral![0])
      }))[0]
  }

  integralType(ctx: JavaParser.IntegralTypeCtx) {
    return [ctx.Byte, ctx.Char, ctx.Int, ctx.Long, ctx.Short]
      .filter(integralType => integralType !== undefined)
      .map(integralType => ({
        kind: 'IntegralType',
        identifier: getIdentifier(integralType![0]),
        location: getLocation(integralType![0])
      }))[0]
  }

  interfaceBody(ctx: JavaParser.InterfaceBodyCtx) {
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

  interfaceDeclaration(ctx: JavaParser.InterfaceDeclarationCtx) {
    if (ctx.annotationTypeDeclaration) throw new Error('Not implemented')
    if (ctx.normalInterfaceDeclaration) {
      return {
        ...this.visit(ctx.normalInterfaceDeclaration),
        interfaceModifiers: ctx.interfaceModifier
          ? ctx.interfaceModifier.map(interfaceModifier => this.visit(interfaceModifier))
          : [],
        location: ctx.interfaceModifier
          ? getLocation(ctx.interfaceModifier[0].location)
          : getLocation(ctx.normalInterfaceDeclaration[0].location)
      }
    }
  }

  interfaceMemberDeclaration(ctx: JavaParser.InterfaceMemberDeclarationCtx) {
    if (ctx.classDeclaration) return this.visit(ctx.classDeclaration)
    if (ctx.constantDeclaration) return this.visit(ctx.constantDeclaration)
    if (ctx.interfaceDeclaration) return this.visit(ctx.interfaceDeclaration)
    if (ctx.interfaceMethodDeclaration) return this.visit(ctx.interfaceMethodDeclaration)
  }

  interfaceMethodDeclaration(ctx: JavaParser.InterfaceMethodDeclarationCtx) {
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

  interfaceMethodModifier(ctx: JavaParser.InterfaceMethodModifierCtx) {
    if (ctx.annotation) throw new Error('Not implemented')
    return [ctx.Abstract, ctx.Default, ctx.Private, ctx.Public, ctx.Static, ctx.Strictfp]
      .filter(interfaceModifier => interfaceModifier !== undefined)
      .map(interfaceModifier => ({
        kind: 'InterfaceMethodModifier',
        identifier: getIdentifier(interfaceModifier![0]),
        location: getLocation(interfaceModifier![0])
      }))[0]
  }

  interfaceModifier(ctx: JavaParser.InterfaceModifierCtx) {
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
      .map(interfaceModifier => ({
        kind: 'InterfaceModifier',
        identifier: getIdentifier(interfaceModifier![0]),
        location: getLocation(interfaceModifier![0])
      }))[0]
  }

  interfacePermits(ctx: JavaParser.InterfacePermitsCtx) {
    return {
      kind: 'InterfacePermits',
      typeNames: ctx.typeName.map(typeName => this.visit(typeName)),
      location: getLocation(ctx.Permits[0])
    }
  }

  interfaceType(ctx: JavaParser.InterfaceTypeCtx) {
    return this.visit(ctx.classType)
  }

  interfaceTypeList(ctx: JavaParser.InterfaceTypeListCtx) {
    return ctx.interfaceType.map(interfaceType => this.visit(interfaceType))
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

  labeledStatement(ctx: JavaParser.LabeledStatementCtx) {
    return {
      kind: 'LabeledStatement',
      identifier: getIdentifier(ctx.Identifier[0]),
      statement: this.visit(ctx.statement),
      location: getLocation(ctx.Identifier[0])
    }
  }

  lambdaBody(ctx: JavaParser.LambdaBodyCtx) {
    if (ctx.block) return this.visit(ctx.block)
    if (ctx.expression) return this.visit(ctx.expression)
  }

  lambdaExpression(ctx: JavaParser.LambdaExpressionCtx, param?: any) {
    return {
      kind: 'LambdaExpression',
      lambdaParameters: this.visit(ctx.lambdaParameters),
      lambdaBody: this.visit(ctx.lambdaBody),
      location: getLocation(ctx.lambdaParameters[0].location)
    }
  }

  lambdaParameter(ctx: JavaParser.LambdaParameterCtx) {
    if (ctx.regularLambdaParameter) return this.visit(ctx.regularLambdaParameter)
    if (ctx.variableArityParameter) return this.visit(ctx.variableArityParameter)
  }

  lambdaParameterList(ctx: JavaParser.LambdaParameterListCtx) {
    if (ctx.explicitLambdaParameterList) return this.visit(ctx.explicitLambdaParameterList)
    if (ctx.inferredLambdaParameterList) return this.visit(ctx.inferredLambdaParameterList)
  }

  lambdaParameterType(ctx: JavaParser.LambdaParameterTypeCtx) {
    if (ctx.Var) return getIdentifier(ctx.Var[0])
    if (ctx.unannType) return this.visit(ctx.unannType)
  }

  lambdaParameters(ctx: JavaParser.LambdaParametersCtx, param?: any) {
    if (ctx.lambdaParametersWithBraces) return this.visit(ctx.lambdaParametersWithBraces)
    if (ctx.Identifier)
      return {
        kind: 'ConciseLambdaParameter',
        identifier: getIdentifier(ctx.Identifier[0]),
        location: getLocation(ctx.Identifier[0])
      }
  }

  lambdaParametersWithBraces(ctx: JavaParser.LambdaParametersWithBracesCtx) {
    return {
      kind: 'LambdaParameters',
      lambdaParameterList: ctx.lambdaParameterList
        ? this.visit(ctx.lambdaParameterList)
        : undefined,
      location: getLocation(ctx.LBrace[0])
    }
  }

  literal(ctx: JavaParser.LiteralCtx) {
    let literalType
    if (ctx.integerLiteral) literalType = this.visit(ctx.integerLiteral)
    if (ctx.floatingPointLiteral) literalType = this.visit(ctx.floatingPointLiteral)
    if (ctx.booleanLiteral) literalType = this.visit(ctx.booleanLiteral)

    if (ctx.CharLiteral) {
      literalType = {
        kind: 'CharacterLiteral',
        value: ctx.CharLiteral[0].image,
        location: getLocation(ctx.CharLiteral[0])
      }
    }

    if (ctx.Null) {
      literalType = {
        kind: 'NullLiteral',
        value: ctx.Null[0].image,
        location: getLocation(ctx.Null[0])
      }
    }

    for (const stringLiteral of [ctx.TextBlock, ctx.StringLiteral]) {
      if (!stringLiteral) continue
      literalType = {
        kind: 'StringLiteral',
        value: stringLiteral[0].image,
        location: getLocation(stringLiteral[0])
      }
    }

    return {
      kind: 'Literal',
      literalType,
      location: literalType.location
    }
  }

  localVariableDeclaration(ctx: JavaParser.LocalVariableDeclarationCtx) {
    return {
      kind: 'LocalVariableDeclaration',
      variableModifier: ctx.variableModifier ? this.visit(ctx.variableModifier) : undefined,
      localVariableType: this.visit(ctx.localVariableType),
      variableDeclaratorList: this.visit(ctx.variableDeclaratorList),
      location: ctx.variableModifier
        ? getLocation(ctx.variableModifier[0].location)
        : getLocation(ctx.localVariableType[0].location)
    }
  }

  localVariableDeclarationStatement(ctx: JavaParser.LocalVariableDeclarationStatementCtx) {
    return this.visit(ctx.localVariableDeclaration)
  }

  localVariableType(ctx: JavaParser.LocalVariableTypeCtx) {
    if (ctx.Var) return { kind: 'Var', location: getLocation(ctx.Var[0]) }
    if (ctx.unannType) return this.visit(ctx.unannType)
  }

  methodName(ctx: JavaParser.MethodNameCtx) {
    return getIdentifier(ctx.Identifier[0])
  }

  methodReferenceSuffix(ctx: JavaParser.MethodReferenceSuffixCtx) {
    if (ctx.typeArguments) throw new Error('Not implemented')
    if (ctx.New) return getIdentifier(ctx.New[0])
    if (ctx.Identifier) return getIdentifier(ctx.Identifier[0])
  }

  methodBody(ctx: JavaParser.MethodBodyCtx) {
    if (ctx.block) return this.visit(ctx.block)
    throw new Error('Not implemented')
  }

  methodDeclaration(ctx: JavaParser.MethodDeclarationCtx) {
    const methodModifiers = ctx.methodModifier ? this.visit(ctx.methodModifier) : []
    return {
      kind: 'MethodDeclaration',
      methodModifiers,
      methodHeader: this.visit(ctx.methodHeader),
      methodBody: this.visit(ctx.methodBody),
      location: ctx.methodModifier
        ? getLocation(ctx.methodModifier[0].location)
        : getLocation(ctx.methodHeader[0].location)
    }
  }

  methodDeclarator(ctx: JavaParser.MethodDeclaratorCtx) {
    if (ctx.dims) throw new Error('Not implemented')
    return {
      kind: 'MethodDeclarator',
      identifier: getIdentifier(ctx.Identifier[0]),
      formalParameterList: ctx.formalParameterList ? this.visit(ctx.formalParameterList) : [],
      location: getLocation(ctx.Identifier[0])
    }
  }

  methodHeader(ctx: JavaParser.MethodHeaderCtx) {
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

  methodInvocationSuffix(ctx: JavaParser.MethodInvocationSuffixCtx) {
    return {
      kind: 'MethodInvocation',
      argumentList: ctx.argumentList ? this.visit(ctx.argumentList) : [],
      location: getLocation(ctx.LBrace[0])
    }
  }

  methodModifier(ctx: JavaParser.MethodModifierCtx) {
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
      .map(modifier => ({
        kind: 'MethodModifier',
        value: modifier![0].image,
        location: getLocation(modifier![0])
      }))
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

  newExpression(ctx: JavaParser.NewExpressionCtx) {
    if (ctx.arrayCreationExpression) return this.visit(ctx.arrayCreationExpression)
    if (ctx.unqualifiedClassInstanceCreationExpression)
      return this.visit(ctx.unqualifiedClassInstanceCreationExpression)
  }

  normalClassDeclaration(ctx: JavaParser.NormalClassDeclarationCtx) {
    if (ctx.typeParameters) throw new Error('Not implemented')
    return {
      kind: 'NormalClassDeclaration',
      classBody: this.visit(ctx.classBody),
      typeIdentifier: this.visit(ctx.typeIdentifier),
      classExtends: ctx.superclass ? this.visit(ctx.superclass) : undefined,
      classImplements: ctx.superinterfaces ? this.visit(ctx.superinterfaces) : undefined,
      classPermits: ctx.classPermits ? this.visit(ctx.classPermits) : undefined
    }
  }

  normalInterfaceDeclaration(ctx: JavaParser.NormalInterfaceDeclarationCtx) {
    if (ctx.typeParameters) throw new Error('Not implemented')
    return {
      kind: 'NormalInterfaceDeclaration',
      typeIdentifier: this.visit(ctx.typeIdentifier),
      interfaceExtends: ctx.extendsInterfaces ? this.visit(ctx.extendsInterfaces) : undefined,
      interfacePermits: ctx.interfacePermits ? this.visit(ctx.interfacePermits) : undefined,
      interfaceBody: this.visit(ctx.interfaceBody)
    }
  }

  numericType(ctx: JavaParser.NumericTypeCtx) {
    if (ctx.floatingPointType) return this.visit(ctx.floatingPointType)
    if (ctx.integralType) return this.visit(ctx.integralType)
  }

  opensModuleDirective(ctx: JavaParser.OpensModuleDirectiveCtx) {
    throw new Error('Not implemented')
  }

  ordinaryCompilationUnit(ctx: JavaParser.OrdinaryCompilationUnitCtx) {
    if (ctx.importDeclaration) throw new Error('Not implemented')
    if (ctx.packageDeclaration) throw new Error('Not implemented')
    if (ctx.typeDeclaration) {
      return {
        kind: 'OrdinaryCompilationUnit',
        topLevelClassOrInterfaceDeclaration: this.visit(ctx.typeDeclaration),
        location: getLocation(ctx.typeDeclaration[0].location)
      }
    }
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

  parenthesisExpression(ctx: JavaParser.ParenthesisExpressionCtx) {
    return {
      kind: 'ParenthesisExpression',
      expression: this.visit(ctx.expression),
      location: getLocation(ctx.LBrace[0])
    }
  }

  pattern(ctx: JavaParser.PatternCtx) {
    if (ctx.AndAnd) throw new Error('Not implemented')
    if (ctx.binaryExpression) throw new Error('Not implemneted')
    return this.visit(ctx.primaryPattern)
  }

  // TODO:
  // @ts-expect-error ts(7023)
  primary(ctx: JavaParser.PrimaryCtx) {
    if (ctx.primarySuffix && ctx.primarySuffix.length > 0) {
      const lastSuffix = ctx.primarySuffix[ctx.primarySuffix.length - 1]
      ctx.primarySuffix = ctx.primarySuffix.slice(0, ctx.primarySuffix.length - 1)
      // @ts-expect-error ts(7022)
      const primary = this.primary(ctx)
      const primarySuffix = this.visit(lastSuffix)

      const isMethodInvocation =
        primarySuffix.kind === 'MethodInvocation' && primary.kind === 'FieldAccess'
      if (isMethodInvocation) {
        return {
          ...primarySuffix,
          identifier: primary.identifier,
          location: primary.location,
          primary: primary.primary
        }
      }

      if (primary.kind === 'ExpressionName') {
        return {
          ...primarySuffix,
          identifier: primary.identifier,
          location: primary.location
        }
      }

      return { ...primarySuffix, primary }
    }
    return this.visit(ctx.primaryPrefix)
  }

  primaryPattern(ctx: JavaParser.PrimaryPatternCtx) {
    throw new Error('Not implemented')
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
    if (ctx.methodInvocationSuffix) return this.visit(ctx.methodInvocationSuffix)
    if (ctx.arrayAccessSuffix) return this.visit(ctx.arrayAccessSuffix)
    if (ctx.Dot && ctx.Identifier) {
      return {
        kind: 'FieldAccess',
        identifier: getIdentifier(ctx.Identifier[0]),
        location: getLocation(ctx.Identifier[0])
      }
    }
    throw new Error('Not implemented')
  }

  primitiveCastExpression(ctx: JavaParser.PrimitiveCastExpressionCtx) {
    return {
      kind: 'CastExpression',
      primitiveType: this.visit(ctx.primitiveType),
      unaryExpression: this.visit(ctx.unaryExpression),
      location: getLocation(ctx.LBrace[0])
    }
  }

  primitiveType(ctx: JavaParser.PrimitiveTypeCtx) {
    if (ctx.annotation) throw new Error('Not implemented')
    if (ctx.Boolean) return getIdentifier(ctx.Boolean[0])
    if (ctx.numericType) return this.visit(ctx.numericType)
  }

  providesModuleDirective(ctx: JavaParser.ProvidesModuleDirectiveCtx) {
    throw new Error('Not implemented')
  }

  qualifiedExplicitConstructorInvocation(
    ctx: JavaParser.QualifiedExplicitConstructorInvocationCtx
  ) {
    if (ctx.typeArguments) throw new Error('Not implemented')
    return {
      kind: 'QualifiedExplicitConstructorInvocation',
      primary: this.visit(ctx.expressionName),
      super: getIdentifier(ctx.Super[0]),
      argumentList: ctx.argumentList ? this.visit(ctx.argumentList) : [],
      location: getLocation(ctx.expressionName[0].location)
    }
  }

  receiverParameter(ctx: JavaParser.ReceiverParameterCtx) {
    throw new Error('Not implemented')
  }

  recordBody(ctx: JavaParser.RecordBodyCtx) {}

  recordBodyDeclaration(ctx: JavaParser.RecordBodyDeclarationCtx) {}

  recordComponent(ctx: JavaParser.RecordComponentCtx) {
    const result: Record<string, any> = {
      recordComponentModifier: ctx.recordComponentModifier
        ? this.visit(ctx.recordComponentModifier)
        : undefined,
      unannType: this.visit(ctx.unannType),
      location: ctx.recordComponentModifier
        ? getLocation(ctx.recordComponentModifier[0].location)
        : getLocation(ctx.unannType[0].location)
    }
    if (ctx.variableArityRecordComponent)
      return { ...this.visit(ctx.variableArityRecordComponent), ...result }
    return {
      kind: 'RecordComponent',
      identifier: ctx.Identifier ? getIdentifier(ctx.Identifier[0]) : undefined,
      ...result
    }
  }

  recordComponentList(ctx: JavaParser.RecordComponentListCtx) {
    return ctx.recordComponent.map(recordComponent => this.visit(recordComponent))
  }

  recordComponentModifier(ctx: JavaParser.RecordComponentModifierCtx) {
    throw new Error('Not implemented')
  }

  recordDeclaration(ctx: JavaParser.RecordDeclarationCtx) {
    if (ctx.typeParameters) throw new Error('Not implemented')
    return {
      kind: 'RecordDeclaration',
      typeIdentifier: this.visit(ctx.typeIdentifier),
      recordHeader: this.visit(ctx.recordHeader),
      classImplements: ctx.superinterfaces ? this.visit(ctx.superinterfaces) : undefined,
      recordBody: this.visit(ctx.recordBody)
    }
  }

  recordHeader(ctx: JavaParser.RecordHeaderCtx) {
    return {
      kind: 'RecordHeader',
      recordComponentList: ctx.recordComponentList
        ? this.visit(ctx.recordComponentList)
        : undefined,
      location: getLocation(ctx.LBrace[0])
    }
  }

  // @ts-expect-error ts(7023)
  referenceType(ctx: JavaParser.ReferenceTypeCtx) {
    if (ctx.annotation) throw new Error('Not implemented')
    if (ctx.dims && ctx.dims.length > 0) {
      const lastDims = ctx.dims[ctx.dims.length - 1]
      ctx.dims = ctx.dims.slice(0, ctx.dims.length - 1)
      return {
        kind: 'ArrayType',
        dims: this.visit(lastDims),
        type: this.referenceType(ctx)
      }
    }
    if (ctx.classOrInterfaceType) return this.visit(ctx.classOrInterfaceType)
    if (ctx.primitiveType) return this.visit(ctx.primitiveType)
  }

  referenceTypeCastExpression(ctx: JavaParser.ReferenceTypeCastExpressionCtx) {
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

  regularLambdaParameter(ctx: JavaParser.RegularLambdaParameterCtx) {
    return {
      kind: 'NormalLambdaParameter',
      variableModifier: ctx.variableModifier ? this.visit(ctx.variableModifier) : undefined,
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

  resource(ctx: JavaParser.ResourceCtx, param?: any) {
    if (ctx.resourceInit) return this.visit(ctx.resourceInit)
    if (ctx.variableAccess) return this.visit(ctx.variableAccess)
  }

  resourceInit(ctx: JavaParser.ResourceInitCtx, param?: any) {
    return {
      kind: 'LocalVariableDeclaration',
      variableModifier: ctx.variableModifier ? this.visit(ctx.variableModifier) : undefined,
      localVariableType: this.visit(ctx.localVariableType),
      variableDeclaratorList: [
        {
          kind: 'VariableDeclarator',
          variableDeclaratorId: {
            kind: 'VariableDeclaratorId',
            identifier: getIdentifier(ctx.Identifier[0]),
            location: getLocation(ctx.Identifier[0])
          },
          variableInitializer: this.visit(ctx.expression),
          location: getLocation(ctx.Identifier[0])
        }
      ],
      location: ctx.variableModifier
        ? getLocation(ctx.variableModifier[0].location)
        : getLocation(ctx.localVariableType[0].location)
    }
  }

  resourceList(ctx: JavaParser.ResourceListCtx, param?: any) {
    return ctx.resource.map(resource => this.visit(resource))
  }

  resourceSpecification(ctx: JavaParser.ResourceSpecificationCtx, param?: any) {
    return {
      kind: 'ResourceSpecification',
      resourceList: this.visit(ctx.resourceList),
      location: getLocation(ctx.LBrace[0])
    }
  }

  result(ctx: JavaParser.ResultCtx) {
    if (ctx.unannType) return this.visit(ctx.unannType)
    if (ctx.Void) return getIdentifier(ctx.Void[0])
  }

  returnStatement(ctx: JavaParser.ReturnStatementCtx) {
    return {
      kind: 'ReturnStatement',
      expression: ctx.expression ? this.visit(ctx.expression) : undefined,
      location: getLocation(ctx.Return[0])
    }
  }

  simpleTypeName(ctx: JavaParser.SimpleTypeNameCtx) {
    return getIdentifier(ctx.Identifier[0])
  }

  statement(ctx: JavaParser.StatementCtx) {
    if (ctx.forStatement) return this.visit(ctx.forStatement)
    if (ctx.ifStatement) return this.visit(ctx.ifStatement)
    if (ctx.labeledStatement) return this.visit(ctx.labeledStatement)
    if (ctx.statementWithoutTrailingSubstatement)
      return this.visit(ctx.statementWithoutTrailingSubstatement)
    if (ctx.whileStatement) return this.visit(ctx.whileStatement)
  }

  statementExpression(ctx: JavaParser.StatementExpressionCtx) {
    return this.visit(ctx.expression)
  }

  statementExpressionList(ctx: JavaParser.StatementExpressionListCtx) {
    return ctx.statementExpression.map(statementExpression => this.visit(statementExpression))
  }

  statementWithoutTrailingSubstatement(ctx: JavaParser.StatementWithoutTrailingSubstatementCtx) {
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
    if (ctx.yieldStatement) return this.visit(ctx.yieldStatement)
  }

  staticInitializer(ctx: JavaParser.StaticInitializerCtx) {
    return {
      kind: 'StaticInitializer',
      block: this.visit(ctx.block),
      location: getLocation(ctx.Static[0])
    }
  }

  superclass(ctx: JavaParser.SuperclassCtx) {
    return {
      kind: 'ClassExtends',
      classType: this.visit(ctx.classType),
      location: getLocation(ctx.Extends[0])
    }
  }

  superinterfaces(ctx: JavaParser.SuperinterfacesCtx) {
    throw new Error('Not implemented')
  }

  switchBlock(ctx: JavaParser.SwitchBlockCtx) {
    if (ctx.switchRule) throw new Error('Not implemented')
    return {
      kind: 'SwitchBlock',
      switchBlockStatementGroups: ctx.switchBlockStatementGroup
        ? ctx.switchBlockStatementGroup.map(switchBlockStatementGroup =>
            this.visit(switchBlockStatementGroup)
          )
        : [],
      location: getLocation(ctx.LCurly[0])
    }
  }

  switchBlockStatementGroup(ctx: JavaParser.SwitchBlockStatementGroupCtx) {
    return {
      kind: 'SwitchBlockStatementGroup',
      switchLabels: ctx.switchLabel.map(switchLabel => this.visit(switchLabel)),
      blockStatements: ctx.blockStatements ? this.visit(ctx.blockStatements) : undefined,
      location: getLocation(ctx.switchLabel[0].location)
    }
  }

  switchLabel(ctx: JavaParser.SwitchLabelCtx) {
    return this.visit(ctx.caseOrDefaultLabel)
  }

  switchRule(ctx: JavaParser.SwitchRuleCtx) {
    throw new Error('Not implemented')
  }

  switchStatement(ctx: JavaParser.SwitchStatementCtx) {
    return {
      kind: 'SwitchStatement',
      expression: this.visit(ctx.expression),
      switchBlock: this.visit(ctx.switchBlock),
      location: getLocation(ctx.Switch[0])
    }
  }

  synchronizedStatement(ctx: JavaParser.SynchronizedStatementCtx) {
    return {
      kind: 'SynchronizedStatement',
      expression: this.visit(ctx.expression),
      block: this.visit(ctx.block),
      location: getLocation(ctx.Synchronized[0])
    }
  }

  ternaryExpression(ctx: JavaParser.TernaryExpressionCtx) {
    const binaryExpression = this.visit(ctx.binaryExpression)
    if (ctx.Colon && ctx.QuestionMark && ctx.expression) {
      return {
        kind: 'ConditionalExpression',
        conditionalExpression: binaryExpression,
        consequentExpression: this.visit(ctx.expression[0]),
        alternativeExpression: this.visit(ctx.expression[1]),
        location: getLocation(ctx.binaryExpression[0].location)
      }
    }
  }

  throwStatement(ctx: JavaParser.ThrowStatementCtx) {
    return {
      kind: 'ThrowStatement',
      expression: this.visit(ctx.expression),
      location: getLocation(ctx.Throw[0])
    }
  }

  throws(ctx: JavaParser.ThrowsCtx) {
    return {
      kind: 'Throws',
      exceptionTypeList: this.visit(ctx.exceptionTypeList),
      location: getLocation(ctx.Throws[0])
    }
  }

  tryStatement(ctx: JavaParser.TryStatementCtx) {
    if (ctx.tryWithResourcesStatement) return this.visit(ctx.tryWithResourcesStatement)
    return {
      kind: 'TryStatement',
      block: ctx.block ? this.visit(ctx.block) : undefined,
      catches: ctx.catches ? this.visit(ctx.catches) : undefined,
      finally: ctx.finally ? this.visit(ctx.finally) : undefined,
      location: getLocation(ctx.Try![0])
    }
  }

  tryWithResourcesStatement(ctx: JavaParser.TryWithResourcesStatementCtx) {
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

  typeDeclaration(ctx: JavaParser.TypeDeclarationCtx) {
    if (ctx.interfaceDeclaration) return this.visit(ctx.interfaceDeclaration)
    if (ctx.classDeclaration) return this.visit(ctx.classDeclaration)
  }

  typeIdentifier(ctx: JavaParser.TypeIdentifierCtx) {
    return getIdentifier(ctx.Identifier[0])
  }

  typeName(ctx: JavaParser.TypeNameCtx) {
    if (ctx.Dot) throw new Error('Not implemented')
    return getIdentifier(ctx.Identifier[0])
  }

  typePattern(ctx: JavaParser.TypePatternCtx) {
    throw new Error('Not implemented')
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

  typeVariable(ctx: JavaParser.TypeVariableCtx) {
    if (ctx.annotation) throw new Error('Not implemented')
    return getIdentifier(ctx.Identifier[0])
  }

  unannClassType(ctx: JavaParser.UnannClassTypeCtx) {
    if (ctx.annotation) throw new Error('Not implemented')
    if (ctx.Dot) throw new Error('Not implemented')
    if (ctx.typeArguments) throw new Error('Not implemented')
    return {
      kind: 'UnannType',
      identifier: getIdentifier(ctx.Identifier[0]),
      location: getLocation(ctx.Identifier[0])
    }
  }

  unannClassOrInterfaceType(ctx: JavaParser.UnannClassOrInterfaceTypeCtx) {
    return this.visit(ctx.unannClassType)
  }

  unannInterfaceType(ctx: JavaParser.UnannInterfaceTypeCtx) {
    throw new Error('Not implemented')
  }

  unannPrimitiveType(ctx: JavaParser.UnannPrimitiveTypeCtx) {
    if (ctx.numericType) return this.visit(ctx.numericType)
    if (ctx.Boolean) {
      return {
        kind: 'UnannType',
        identifier: getIdentifier(ctx.Boolean[0]),
        location: getLocation(ctx.Boolean[0])
      }
    }
  }

  unannPrimitiveTypeWithOptionalDimsSuffix(
    ctx: JavaParser.UnannPrimitiveTypeWithOptionalDimsSuffixCtx
  ) {
    const unannPrimitiveType = this.visit(ctx.unannPrimitiveType)
    if (ctx.dims) {
      return {
        kind: 'UnannArrayType',
        unannType: unannPrimitiveType,
        dims: this.visit(ctx.dims),
        location: getLocation(ctx.unannPrimitiveType[0].location)
      }
    }
    return unannPrimitiveType
  }

  unannReferenceType(ctx: JavaParser.UnannReferenceTypeCtx) {
    const unannType = this.visit(ctx.unannClassOrInterfaceType)
    if (ctx.dims) {
      return {
        kind: 'UnannArrayType',
        dims: this.visit(ctx.dims),
        unannType,
        location: getLocation(ctx.unannClassOrInterfaceType[0].location)
      }
    }
    return unannType
  }

  unannType(ctx: JavaParser.UnannTypeCtx) {
    if (ctx.unannPrimitiveTypeWithOptionalDimsSuffix)
      return this.visit(ctx.unannPrimitiveTypeWithOptionalDimsSuffix)
    if (ctx.unannReferenceType) return this.visit(ctx.unannReferenceType)
  }

  unannTypeVariable(ctx: JavaParser.UnannTypeVariableCtx) {
    return getIdentifier(ctx.Identifier[0])
  }

  unaryExpression(ctx: JavaParser.UnaryExpressionCtx) {
    if (ctx.UnaryPrefixOperator) return getIdentifier(ctx.UnaryPrefixOperator[0])
    if (ctx.UnarySuffixOperator) return getIdentifier(ctx.UnarySuffixOperator[0])
    return this.visit(ctx.primary)
  }

  unaryExpressionNotPlusMinus(ctx: JavaParser.UnaryExpressionNotPlusMinusCtx) {
    const primary = this.visit(ctx.primary)
    if (ctx.UnaryPrefixOperatorNotPlusMinus) {
      return {
        kind: 'UnaryExpressionNotPlusMinus',
        prefixOperator: getIdentifier(ctx.UnaryPrefixOperatorNotPlusMinus[0]),
        primary,
        location: getLocation(ctx.UnaryPrefixOperatorNotPlusMinus[0])
      }
    }
    if (ctx.UnarySuffixOperator) {
      return {
        kind: 'PostfixExpression',
        postfixOperator: getIdentifier(ctx.UnarySuffixOperator[0]),
        primary,
        location: getLocation(ctx.primary[0].location)
      }
    }
    return primary
  }

  unqualifiedClassInstanceCreationExpression(
    ctx: JavaParser.UnqualifiedClassInstanceCreationExpressionCtx
  ) {
    if (ctx.typeArguments) throw new Error('Not implemented')
  }

  unqualifiedExplicitConstructorInvocation(
    ctx: JavaParser.UnqualifiedExplicitConstructorInvocationCtx
  ) {
    if (ctx.typeArguments) throw new Error('Not implemented')
    return {
      kind: 'UnqualifiedExplicitConstructorInvocation',
      identifier: ctx.Super
        ? getIdentifier(ctx.Super[0])
        : ctx.This
          ? getIdentifier(ctx.This[0])
          : undefined,
      argumentList: ctx.argumentList ? this.visit(ctx.argumentList) : [],
      location: ctx.Super
        ? getLocation(ctx.Super[0])
        : ctx.This
          ? getLocation(ctx.This[0])
          : undefined
    }
  }

  usesModuleDirective(ctx: JavaParser.UsesModuleDirectiveCtx) {
    throw new Error('Not implemented')
  }

  variableAccess(ctx: JavaParser.VariableAccessCtx) {
    return this.visit(ctx.primary)
  }

  variableArityParameter(ctx: JavaParser.VariableArityParameterCtx) {
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

  variableArityRecordComponent(ctx: JavaParser.VariableArityRecordComponentCtx) {
    return {
      kind: 'VariableArityRecordComponent',
      identifier: getIdentifier(ctx.Identifier[0])
    }
  }

  variableDeclarator(ctx: JavaParser.VariableDeclaratorCtx) {
    return {
      kind: 'VariableDeclarator',
      variableDeclaratorId: this.visit(ctx.variableDeclaratorId),
      variableInitializer: ctx.variableInitializer
        ? this.visit(ctx.variableInitializer)
        : undefined,
      location: getLocation(ctx.variableDeclaratorId[0].location)
    }
  }

  variableDeclaratorId(ctx: JavaParser.VariableDeclaratorIdCtx) {
    return {
      kind: 'VariableDeclaratorId',
      identifier: getIdentifier(ctx.Identifier[0]),
      dims: ctx.dims ? this.visit(ctx.dims) : undefined,
      location: getLocation(ctx.Identifier[0])
    }
  }

  variableDeclaratorList(ctx: JavaParser.VariableDeclaratorListCtx) {
    return ctx.variableDeclarator.map(declarator => this.visit(declarator))
  }

  variableInitializer(ctx: JavaParser.VariableInitializerCtx) {
    if (ctx.arrayInitializer) return this.visit(ctx.arrayInitializer)
    if (ctx.expression) return this.visit(ctx.expression)
  }

  variableInitializerList(ctx: JavaParser.VariableInitializerListCtx) {
    return ctx.variableInitializer.map(variableInitializer => this.visit(variableInitializer))
  }

  variableModifier(ctx: JavaParser.VariableModifierCtx) {
    if (ctx.annotation) throw new Error('Not implemented')
    if (ctx.Final) {
      return {
        kind: 'VariableModifier',
        identifier: getIdentifier(ctx.Final[0]),
        location: getLocation(ctx.Final[0])
      }
    }
  }

  variableParaRegularParameter(ctx: JavaParser.VariableParaRegularParameterCtx) {
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

  whileStatement(ctx: JavaParser.WhileStatementCtx) {
    return {
      kind: 'WhileStatement',
      condition: this.visit(ctx.expression),
      body: this.visit(ctx.statement),
      location: getLocation(ctx.While[0])
    }
  }

  wildcard(ctx: JavaParser.WildcardCtx) {
    throw new Error('Not implemented')
  }

  wildcardBounds(ctx: JavaParser.WildcardBoundsCtx) {
    throw new Error('Not implemented')
  }

  yieldStatement(ctx: JavaParser.YieldStatementCtx) {
    return {
      kind: 'YieldStatement',
      expresssion: this.visit(ctx.expression),
      location: getLocation(ctx.Yield[0])
    }
  }
}

export default AstExtractor

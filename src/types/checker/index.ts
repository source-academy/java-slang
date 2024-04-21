import { Array as ArrayType } from '../types/arrays'
import { Integer, String, Void } from '../types/references'
import { CaseConstant, Node } from '../ast/specificationTypes'
import { Type } from '../types/type'
import {
  ArrayRequiredError,
  BadOperandTypesError,
  CannotFindSymbolError,
  IncompatibleTypesError,
  NotApplicableToExpressionTypeError,
  TypeCheckerError,
  TypeCheckerInternalError,
  VariableAlreadyDefinedError
} from '../errors'
import { createArgumentList } from '../typeFactories/methodFactory'
import {
  Boolean,
  Char,
  Double,
  Float,
  Int,
  Long,
  Null,
  getFloatType,
  getNumberType
} from '../types/primitives'
import { createArrayType } from '../typeFactories/arrayFactory'
import { ClassImpl } from '../types/classes'
import { ArgumentList, Method } from '../types/methods'
import { unannTypeToString } from '../ast/utils'
import { Frame } from './environment'
import { addClasses, addClassMethods, addClassParents } from './prechecks'
import { checkBinaryOperation, checkPostfixOperation, checkUnaryOperation } from './operations'
import { checkSwitchExpression } from './statements'

const PRIMITIVE_INT_TYPE = new Int()
const INTEGER_TYPE = new Integer()

export type Result = {
  currentType: Type | null
  hasErrors: boolean
  errors: TypeCheckerError[]
}

export const newResult = (
  currentType: Type | null = null,
  errors: TypeCheckerError[] = []
): Result => ({
  currentType,
  hasErrors: errors.length > 0,
  errors
})

export const OK_RESULT: Result = newResult(null)

export const check = (node: Node, frame: Frame = Frame.globalFrame()): Result => {
  const typeCheckingFrame = frame.newChildFrame()
  const addClassesResult = addClasses(node, typeCheckingFrame)
  if (addClassesResult.hasErrors) return addClassesResult
  const addClassParentsResult = addClassParents(node, typeCheckingFrame)
  if (addClassParentsResult.hasErrors) return addClassParentsResult
  const addClassMethodsResult = addClassMethods(node, typeCheckingFrame)
  if (addClassMethodsResult.hasErrors) return addClassMethodsResult
  return typeCheckBody(node, typeCheckingFrame)
}

export const typeCheckBody = (node: Node, frame: Frame = Frame.globalFrame()): Result => {
  switch (node.kind) {
    case 'ArrayAccess': {
      const arrayReferenceExpressionCheck = typeCheckBody(node.arrayReferenceExpression, frame)
      if (arrayReferenceExpressionCheck.hasErrors) return arrayReferenceExpressionCheck
      if (!(arrayReferenceExpressionCheck.currentType! instanceof ArrayType))
        return newResult(null, [new ArrayRequiredError(node.arrayReferenceExpression.location)])
      const indexExpressionCheck = typeCheckBody(node.indexExpression, frame)
      if (indexExpressionCheck.hasErrors) return indexExpressionCheck
      return !INTEGER_TYPE.equals(indexExpressionCheck.currentType!) &&
        !PRIMITIVE_INT_TYPE.equals(indexExpressionCheck.currentType!)
        ? newResult(null, [new IncompatibleTypesError(node.indexExpression.location)])
        : newResult(arrayReferenceExpressionCheck.currentType.getContentType())
    }
    case 'ArrayCreationExpressionWithInitializer': {
      let type = frame.getType(unannTypeToString(node.type), node.type.location)
      if (type instanceof TypeCheckerError) return newResult(null, [type])
      node.dims.dims.forEach(() => (type = new ArrayType(type as Type)))
      const arrayType = createArrayType(type, node.arrayInitializer, expression => {
        const result = typeCheckBody(expression, frame)
        if (result.errors.length > 0) return result.errors[0]
        if (!result.currentType) throw new Error('array initializer expression should have a type')
        return result.currentType
      })
      if (arrayType instanceof TypeCheckerError) return newResult(null, [arrayType])
      return newResult(type)
    }
    case 'ArrayCreationExpressionWithoutInitializer': {
      let type = frame.getType(unannTypeToString(node.type), node.type.location)
      if (type instanceof Error) return newResult(null, [type])
      const dimensionExpressionErrors: Error[] = []
      node.dimExprs.dimExprs.forEach(dimensionExpression => {
        const checkResult = typeCheckBody(dimensionExpression.expression, frame)
        if (checkResult.errors.length > 0)
          return dimensionExpressionErrors.push(...checkResult.errors)
        const dimensionExpressionType = checkResult.currentType
        if (
          !INTEGER_TYPE.equals(dimensionExpressionType) &&
          !PRIMITIVE_INT_TYPE.equals(dimensionExpressionType)
        )
          return dimensionExpressionErrors.push(new IncompatibleTypesError())
        type = new ArrayType(type as Type)
      })
      return newResult(type)
    }
    case 'Assignment': {
      const leftCheck = typeCheckBody(node.leftHandSide, frame)
      if (leftCheck.errors.length > 0) return newResult(null, leftCheck.errors)
      if (!leftCheck.currentType) throw new Error('Left type in assignment should exist.')
      const right = node.rightHandSide
      const leftType = leftCheck.currentType
      if (leftType instanceof TypeCheckerError) return newResult(null, [leftType])
      const { currentType, errors } = typeCheckBody(right, frame)
      if (errors.length > 0) return newResult(null, errors)
      if (!currentType) throw new Error('Right side of assignment statment should return a type.')
      if (!leftType.canBeAssigned(currentType))
        return newResult(null, [new IncompatibleTypesError(node.assignmentOperator.location)])
      return OK_RESULT
    }
    case 'BasicForStatement': {
      const errors: TypeCheckerError[] = []
      let forConditionFrame: Frame = frame
      if (node.forInit) {
        if (node.forInit.kind === 'LocalVariableDeclaration') {
          const preCheckErrors = node.forInit.variableDeclaratorList.variableDeclarators.reduce(
            (errors, { variableDeclaratorId }) =>
              frame.isVariableInFrame(variableDeclaratorId.identifier.identifier)
                ? [...errors, new VariableAlreadyDefinedError(variableDeclaratorId.location)]
                : errors,
            []
          )
          if (preCheckErrors.length > 0) return newResult(null, preCheckErrors)
        }
        forConditionFrame = frame.newChildFrame()
        const forInitCheck = typeCheckBody(node.forInit, forConditionFrame)
        if (forInitCheck.hasErrors) return forInitCheck
      }
      if (node.expression) {
        const conditionCheck = typeCheckBody(node.expression, forConditionFrame)
        errors.push(...conditionCheck.errors)
      }
      if (node.forUpdate) {
        node.forUpdate.statementExpressions.forEach(statement => {
          const checkResult = typeCheckBody(statement, forConditionFrame)
          errors.push(...checkResult.errors)
        })
      }
      const forBodyFrame = forConditionFrame.newChildFrame()
      const bodyCheck = typeCheckBody(node.statement, forBodyFrame)
      if (bodyCheck.errors) errors.push(...bodyCheck.errors)
      return newResult(null, errors)
    }
    case 'BinaryExpression': {
      const { leftHandSide, binaryOperator, rightHandSide } = node
      const { currentType: leftType, errors: leftErrors } = typeCheckBody(leftHandSide, frame)
      if (leftErrors.length > 0) return newResult(null, leftErrors)
      const { currentType: rightType, errors: rightErrors } = typeCheckBody(rightHandSide, frame)
      if (rightErrors.length > 0) return newResult(null, rightErrors)
      if (!leftType || !rightType)
        throw new Error('Left and right of binary expression should have a type.')
      const binaryOperationCheck = checkBinaryOperation(leftType, binaryOperator, rightType)
      if (binaryOperationCheck instanceof TypeCheckerError)
        return newResult(null, [binaryOperationCheck])
      return newResult(binaryOperationCheck)
    }
    case 'Block': {
      const errors: TypeCheckerError[] = []
      if (node.blockStatements) {
        const newFrame = frame.newChildFrame()
        node.blockStatements.blockStatements.forEach(statement => {
          const result = typeCheckBody(statement, newFrame)
          if (result.hasErrors) errors.push(...result.errors)
        })
      }
      return newResult(null, errors)
    }
    case 'BlockStatements': {
      const errors: TypeCheckerError[] = []
      node.blockStatements.forEach(statement => {
        const result = typeCheckBody(statement, frame)
        if (result.hasErrors) errors.push(...result.errors)
      })
      return newResult(null, errors)
    }
    case 'BreakStatement': {
      return OK_RESULT
    }
    case 'ClassInstanceCreationExpression': {
      const classIdentifier =
        node.unqualifiedClassInstanceCreationExpression.classOrInterfaceTypeToInstantiate
          .identifiers[0]
      const classType = frame.getType(classIdentifier.identifier, classIdentifier.location)
      if (classType instanceof Error) return newResult(null, [classType])
      if (!(classType instanceof ClassImpl)) throw new Error('ClassImpl instance was expected')
      const errors: TypeCheckerError[] = []
      const argumentTypes: Type[] = []
      let argsList: ArgumentList = new ArgumentList()
      const args = node.unqualifiedClassInstanceCreationExpression.argumentList
      if (args) {
        for (const expression of args.expressions) {
          const argumentExpressionResult = typeCheckBody(expression, frame)
          if (argumentExpressionResult.hasErrors) {
            errors.push(...argumentExpressionResult.errors)
            continue
          }
          if (!argumentExpressionResult.currentType)
            throw new Error('Arguments should have a type.')
          argumentTypes.push(argumentExpressionResult.currentType)
        }
        if (errors.length > 0) return newResult(null, errors)
        const argumentList = createArgumentList(...argumentTypes)
        if (argumentList instanceof TypeCheckerError) return newResult(null, [argumentList])
        argsList = argumentList
      }
      const constructor = classType.accessConstructor()
      if (!constructor) throw new Error('constructor should not be null')
      const returnType = constructor.invoke(
        argsList,
        node.unqualifiedClassInstanceCreationExpression.location
      )
      if (returnType instanceof TypeCheckerError) return newResult(null, [returnType])
      return newResult(returnType)
    }
    case 'ContinueStatement': {
      return OK_RESULT
    }
    case 'ConstructorBody': {
      const errors: TypeCheckerError[] = []
      if (node.blockStatements) {
        const errors: TypeCheckerError[] = []
        node.blockStatements.blockStatements.forEach(statement => {
          const result = typeCheckBody(statement, frame)
          if (result.hasErrors) errors.push(...result.errors)
        })
      }
      return newResult(null, errors)
    }
    case 'EmptyStatement': {
      return OK_RESULT
    }
    case 'EnhancedForStatement': {
      const variableType = frame.getType(
        unannTypeToString(node.localVariableDeclaration.localVariableType),
        node.localVariableDeclaration.localVariableType.location
      )
      if (variableType instanceof TypeCheckerError) return newResult(null, [variableType])
      const expressionCheck = typeCheckBody(node.expression, frame)
      if (expressionCheck.hasErrors) return expressionCheck
      const expressionType = expressionCheck.currentType
      if (!(expressionType instanceof ArrayType))
        return newResult(null, [new NotApplicableToExpressionTypeError(node.expression.location)])
      const arrayContentType = expressionType.getContentType()
      if (!variableType.canBeAssigned(arrayContentType))
        return newResult(null, [new IncompatibleTypesError(node.localVariableDeclaration.location)])
      const forExpressionFrame = frame.newChildFrame()
      const error = forExpressionFrame.setVariable(
        node.localVariableDeclaration.variableDeclaratorList.variableDeclarators[0]
          .variableDeclaratorId.identifier.identifier,
        variableType,
        node.localVariableDeclaration.variableDeclaratorList.variableDeclarators[0]
          .variableDeclaratorId.identifier.location
      )
      if (error) return newResult(null, [error])
      const statementCheck = typeCheckBody(node.statement, forExpressionFrame)
      if (statementCheck.hasErrors) return statementCheck
      return OK_RESULT
    }
    case 'ExpressionName': {
      const variable = frame.getVariable(node.identifier.identifier, node.identifier.location)
      if (!(variable instanceof TypeCheckerError)) return newResult(variable)
      if (!(variable instanceof CannotFindSymbolError)) return newResult(null, [variable])
      const type = frame.getType(node.identifier.identifier, node.identifier.location)
      if (type instanceof TypeCheckerError) return newResult(null, [type])
      return newResult(type)
    }
    case 'FieldAccess': {
      const checkPrimary = typeCheckBody(node.primary, frame)
      if (checkPrimary.errors.length > 0) return newResult(null, checkPrimary.errors)
      const primaryType = checkPrimary.currentType
      if (!primaryType) throw new Error('cannot access field of no type')
      const fieldType = primaryType.accessField(
        node.identifier.identifier,
        node.identifier.location
      )
      if (fieldType instanceof Error) return newResult(null, [fieldType])
      return newResult(fieldType)
    }
    case 'Identifier': {
      const variable = frame.getVariable(node.identifier, node.location)
      if (!(variable instanceof TypeCheckerError)) return newResult(variable)
      if (!(variable instanceof CannotFindSymbolError)) return newResult(null, [variable])
      const type = frame.getType(node.identifier, node.location)
      if (type instanceof TypeCheckerError) return newResult(null, [type])
      return newResult(type)
    }
    case 'IfThenElseStatement': {
      const errors: TypeCheckerError[] = []
      const conditionResult = typeCheckBody(node.expression, frame)
      if (conditionResult.errors) errors.push(...conditionResult.errors)
      const booleanType = new Boolean()
      if (conditionResult.currentType && !booleanType.canBeAssigned(conditionResult.currentType))
        errors.push(new IncompatibleTypesError())
      const consequentResult = typeCheckBody(node.statementNoShortIf, frame)
      if (consequentResult.errors) errors.push(...consequentResult.errors)
      const alternateResult = typeCheckBody(node.statement, frame)
      if (alternateResult.errors) errors.push(...alternateResult.errors)
      return newResult(null, errors)
    }
    case 'IfThenStatement': {
      const errors: TypeCheckerError[] = []
      const conditionResult = typeCheckBody(node.expression, frame)
      if (conditionResult.errors) errors.push(...conditionResult.errors)
      const booleanType = new Boolean()
      if (conditionResult.currentType && !booleanType.canBeAssigned(conditionResult.currentType))
        errors.push(new IncompatibleTypesError(node.expression.location))
      const newFrame = frame.newChildFrame()
      const consequentResult = typeCheckBody(node.statement, newFrame)
      if (consequentResult.errors) errors.push(...consequentResult.errors)
      return newResult(null, errors)
    }
    case 'InstanceofExpression': {
      console.log(node)
      return OK_RESULT
    }
    case 'BinaryLiteral':
    case 'DecimalLiteral':
    case 'HexLiteral':
    case 'OctalLiteral': {
      const Type = getNumberType(node.identifier.identifier) === 'long' ? Long : Int
      const type = Type.from(node.identifier.identifier, node.identifier.location)
      return type instanceof TypeCheckerError ? newResult(null, [type]) : newResult(type)
    }
    case 'DecimalFloatingPointLiteral':
    case 'HexadecimalFloatingPointLiteral': {
      const Type = getFloatType(node.identifier.identifier) === 'float' ? Float : Double
      const type = Type.from(node.identifier.identifier, node.identifier.location)
      return type instanceof TypeCheckerError ? newResult(null, [type]) : newResult(type)
    }
    case 'BooleanLiteral': {
      const type = Boolean.from(node.identifier.identifier, node.identifier.location)
      return type instanceof TypeCheckerError ? newResult(null, [type]) : newResult(type)
    }
    case 'CharacterLiteral': {
      const type = Char.from(node.identifier.identifier, node.identifier.location)
      return type instanceof TypeCheckerError ? newResult(null, [type]) : newResult(type)
    }
    case 'NullLiteral':
      return newResult(Null.from(node.identifier.identifier, node.identifier.location))
    case 'StringLiteral':
      return newResult(String.from(node.identifier.identifier, node.identifier.location))
    case 'LocalVariableDeclaration': {
      if (!node.variableDeclaratorList) throw new Error('Variable declarator list is undefined.')
      const errors: TypeCheckerError[] = []
      for (const variableDeclarator of node.variableDeclaratorList.variableDeclarators) {
        const declaredType = frame.getType(
          unannTypeToString(node.localVariableType),
          node.localVariableType.location
        )
        if (declaredType instanceof TypeCheckerError) return newResult(null, [declaredType])
        const { variableInitializer } = variableDeclarator
        if (variableInitializer) {
          const type = createArrayType(
            declaredType,
            variableInitializer,
            expression => {
              const result = typeCheckBody(expression, frame)
              if (result.errors.length > 0) return result.errors[0]
              if (!result.currentType)
                throw new Error('array initializer expression should have a type')
              return result.currentType
            },
            variableInitializer.location
          )
          if (type instanceof TypeCheckerError) errors.push(type)
        }
        const error = frame.setVariable(
          variableDeclarator.variableDeclaratorId.identifier.identifier,
          declaredType,
          variableDeclarator.variableDeclaratorId.location
        )
        if (error) errors.push(error)
      }
      return newResult(null, errors)
    }
    case 'MethodInvocation': {
      const errors: TypeCheckerError[] = []
      let method: Method | TypeCheckerError
      if (node.primary) {
        const primaryCheck = typeCheckBody(node.primary, frame)
        if (primaryCheck.errors.length > 0) return newResult(null, primaryCheck.errors)
        if (!primaryCheck.currentType) throw new Error('primary check should return a type')
        method = primaryCheck.currentType.accessMethod(
          node.methodName.identifier,
          node.methodName.location
        )
      } else {
        method = frame.getMethod(node.methodName.identifier, node.methodName.location)
      }
      if (method instanceof TypeCheckerError) return newResult(null, [method])
      const argumentTypes: Type[] = []
      if (node.argumentList) {
        for (const argument of node.argumentList.expressions) {
          const argumentResult = typeCheckBody(argument, frame)
          if (argumentResult.hasErrors) {
            errors.push(...argumentResult.errors)
            continue
          }
          if (!argumentResult.currentType) throw new Error('Arguments should have a type.')
          argumentTypes.push(argumentResult.currentType)
        }
      }
      const argumentList = createArgumentList(...argumentTypes)
      if (argumentList instanceof TypeCheckerError)
        return newResult(null, [...errors, argumentList])
      const returnType = method.invoke(argumentList, node.location)
      if (returnType instanceof TypeCheckerError) return newResult(null, [...errors, returnType])
      return newResult(returnType, errors)
    }
    case 'NormalClassDeclaration': {
      const errors: TypeCheckerError[] = []
      const classType = frame.getType(node.typeIdentifier.identifier, node.typeIdentifier.location)
      if (classType instanceof TypeCheckerError) return newResult(null, [classType])
      if (!(classType instanceof ClassImpl))
        throw new Error('class type retrieved should be ClassImpl')

      const classFrame = frame.newChildFrame()
      classType.mapFields((name, type) => {
        const error = classFrame.setVariable(name, type, { startLine: -1, startOffset: -1 })
        if (error) errors.push(error)
      })
      classType.mapMethods((name, method) => {
        const error = classFrame.setMethod(name, method, { startLine: -1, startOffset: -1 })
        if (error) errors.push(error)
      })
      if (errors.length > 0) return newResult(null, errors)

      let numFieldDeclarations = 0
      let numMethodDeclarations = 0
      for (let i = 0; i < node.classBody.classBodyDeclarations.length; i++) {
        const bodyDeclaration = node.classBody.classBodyDeclarations[i]

        switch (bodyDeclaration.kind) {
          case 'ConstructorDeclaration': {
            const constructor = classType.accessConstructor()
            if (!constructor) throw new Error('ClassImpl should have a constructor')
            const signature = constructor.getOverload(
              i - numFieldDeclarations - numMethodDeclarations
            )
            const methodFrame = classFrame.newChildFrame()
            const constructorMethodErrors: TypeCheckerError[] = []
            signature.mapParameters((name, type, isVarargs) => {
              if (isVarargs) type = new ArrayType(type)
              const error = methodFrame.setVariable(name, type, { startLine: -1, startOffset: -1 })
              if (error) constructorMethodErrors.push(error)
            })
            if (constructorMethodErrors.length > 0) {
              errors.push(...constructorMethodErrors)
              break
            }
            const { errors: checkErrors } = typeCheckBody(
              bodyDeclaration.constructorBody,
              methodFrame
            )
            if (checkErrors.length > 0) errors.push(...checkErrors)
            break
          }
          case 'FieldDeclaration': {
            for (const variableDeclarator of bodyDeclaration.variableDeclaratorList
              .variableDeclarators) {
              const field = classType.accessField(
                variableDeclarator.variableDeclaratorId.identifier.identifier,
                variableDeclarator.variableDeclaratorId.identifier.location
              )
              if (field instanceof TypeCheckerError) throw new Error('field should exist in class')
              const initializer = variableDeclarator.variableInitializer
              if (initializer) {
                const type = createArrayType(field, initializer, expression => {
                  const result = typeCheckBody(expression, frame)
                  if (result.errors.length > 0) return result.errors[0]
                  if (!result.currentType)
                    throw new Error('array initializer expression should have a type')
                  return result.currentType
                })
                if (type instanceof TypeCheckerError) errors.push(type)
              }
            }
            break
          }
          case 'MethodDeclaration': {
            const methodIdentifier = bodyDeclaration.methodHeader.methodDeclarator.identifier
            const methodName = methodIdentifier.identifier
            const method = classType.accessMethod(methodName, methodIdentifier.location)
            if (method instanceof TypeCheckerError)
              throw new Error('ClassImpl should have the method')
            const overloadIndex = node.classBody.classBodyDeclarations
              .filter(node => {
                return (
                  node.kind === 'MethodDeclaration' &&
                  node.methodHeader.methodDeclarator.identifier.identifier === methodName
                )
              })
              .findIndex(node => node === bodyDeclaration)
            const signature = method.getOverload(overloadIndex)

            const methodFrame = classFrame.newChildFrame()
            const methodErrors: TypeCheckerError[] = []
            methodFrame.setReturnType(signature.getReturnType())
            signature.mapParameters((name, type, isVarargs) => {
              if (isVarargs) type = new ArrayType(type)
              const error = methodFrame.setVariable(name, type, { startLine: -1, startOffset: -1 })
              if (error) methodErrors.push(error)
            })
            if (methodErrors.length > 0) {
              errors.push(...methodErrors)
              break
            }
            const { errors: checkErrors } = typeCheckBody(bodyDeclaration.methodBody, methodFrame)
            if (checkErrors.length > 0) errors.push(...checkErrors)
            break
          }
        }

        if (bodyDeclaration.kind === 'FieldDeclaration') numFieldDeclarations += 1
        if (bodyDeclaration.kind === 'MethodDeclaration') numMethodDeclarations += 1
      }
      return newResult(null, errors)
    }
    case 'OrdinaryCompilationUnit': {
      const typeCheckErrors = node.topLevelClassOrInterfaceDeclarations
        .map(declaration => typeCheckBody(declaration, frame))
        .reduce((errors, result) => (result.hasErrors ? [...errors, ...result.errors] : errors), [])
      return newResult(null, typeCheckErrors)
    }
    case 'ParenthesisExpression': {
      return typeCheckBody(node.expression, frame)
    }
    case 'PostfixExpression': {
      const expressionCheck = typeCheckBody(node.postfixExpression, frame)
      if (expressionCheck.errors.length > 0) return expressionCheck
      if (!expressionCheck.currentType) throw new Error('Expression check did not return a type.')
      const postfixExpressionCheck = checkPostfixOperation(
        expressionCheck.currentType,
        node.postfixOperator
      )
      return postfixExpressionCheck instanceof TypeCheckerError
        ? newResult(null, [postfixExpressionCheck])
        : newResult(postfixExpressionCheck)
    }
    case 'ReturnStatement': {
      let returnExpressionType: Type = new Void()
      if (node.expression) {
        const expressionCheck = typeCheckBody(node.expression, frame)
        if (expressionCheck.errors.length > 0) return expressionCheck
        if (!expressionCheck.currentType) throw new Error('Expression check should return a type.')
        returnExpressionType = expressionCheck.currentType
      }
      const returnType = frame.getReturn()
      if (returnType instanceof Error) return newResult(null, [returnType])
      if (!returnType.canBeAssigned(returnExpressionType))
        return newResult(null, [new IncompatibleTypesError()])
      return OK_RESULT
    }
    case 'StatementExpressionList': {
      return newResult(
        null,
        node.statementExpressions
          .map(statementExpression => typeCheckBody(statementExpression, frame))
          .reduce(
            (errors, result) => (result.hasErrors ? [...errors, ...result.errors] : errors),
            []
          )
      )
    }
    case 'SwitchStatement': {
      const expressionCheck = typeCheckBody(node.expression, frame)
      if (expressionCheck.hasErrors) return expressionCheck
      if (!expressionCheck.currentType)
        throw new TypeCheckerInternalError('Switch selector expression should have a type.')
      const checkExpression = checkSwitchExpression(
        expressionCheck.currentType,
        node.expression.location
      )
      if (checkExpression instanceof TypeCheckerError) return newResult(null, [checkExpression])

      const switchBlockFrame = frame.newChildFrame()
      for (const group of node.switchBlock.switchBlockStatementGroups) {
        for (const switchLabel of group.switchLabels) {
          if ('caseConstant' in switchLabel) {
            const checkResult = typeCheckBody(
              switchLabel.caseConstant as CaseConstant,
              switchBlockFrame
            )
            if (checkResult.hasErrors) return checkResult
            if (!checkResult.currentType)
              throw new TypeCheckerInternalError('Switch case constant should have a type.')
            if (expressionCheck.currentType.canBeAssigned(checkResult.currentType)) continue
            return newResult(null, [new IncompatibleTypesError(switchLabel.location)])
          }
        }
        if (group.blockStatements) {
          const checkBlockStatements = typeCheckBody(group.blockStatements, switchBlockFrame)
          if (checkBlockStatements.hasErrors) return checkBlockStatements
        }
      }
      return OK_RESULT
    }
    case 'UnaryExpression': {
      if (node.prefixOperator.identifier === '-') {
        switch (node.unaryExpression.kind) {
          case 'BinaryLiteral':
          case 'DecimalFloatingPointLiteral':
          case 'DecimalLiteral':
          case 'HexLiteral':
          case 'OctalLiteral':
          case 'HexadecimalFloatingPointLiteral': {
            node.unaryExpression.identifier.identifier =
              '-' + node.unaryExpression.identifier.identifier
          }
          default:
        }
      }

      const expressionCheck = typeCheckBody(node.unaryExpression, frame)
      if (expressionCheck.hasErrors) return expressionCheck
      if (!expressionCheck.currentType)
        throw new TypeCheckerInternalError('Type expected from unary expression expression')
      const unaryOperationCheck = checkUnaryOperation(
        node.prefixOperator,
        expressionCheck.currentType
      )
      return unaryOperationCheck instanceof TypeCheckerError
        ? newResult(null, [unaryOperationCheck])
        : newResult(unaryOperationCheck)
    }
    case 'UnqualifiedClassInstanceCreationExpression': {
      const classIdentifier = node.classOrInterfaceTypeToInstantiate.identifiers[0]
      const classType = frame.getType(classIdentifier.identifier, classIdentifier.location)
      if (classType instanceof Error) return newResult(null, [classType])
      if (!(classType instanceof ClassImpl)) throw new Error('ClassImpl instance was expected')
      const errors: TypeCheckerError[] = []
      const argumentTypes: Type[] = []
      let argsList: ArgumentList = new ArgumentList()
      const args = node.argumentList
      if (args) {
        for (const expression of args.expressions) {
          const argumentExpressionResult = typeCheckBody(expression, frame)
          if (argumentExpressionResult.hasErrors) {
            errors.push(...argumentExpressionResult.errors)
            continue
          }
          if (!argumentExpressionResult.currentType)
            throw new Error('Arguments should have a type.')
          argumentTypes.push(argumentExpressionResult.currentType)
        }
        if (errors.length > 0) return newResult(null, errors)
        const argumentList = createArgumentList(...argumentTypes)
        if (argumentList instanceof TypeCheckerError) return newResult(null, [argumentList])
        argsList = argumentList
      }
      const constructor = classType.accessConstructor()
      if (!constructor) throw new Error('constructor should not be null')
      const returnType = constructor.invoke(argsList, node.location)
      if (returnType instanceof TypeCheckerError) return newResult(null, [returnType])
      return newResult(returnType)
    }
    case 'ConditionalExpression': {
      const conditionCheck = typeCheckBody(node.conditionalExpression, frame)
      if (conditionCheck.hasErrors) return conditionCheck
      if (!conditionCheck.currentType)
        throw new Error('Type missing in ternary expresion condition.')
      const booleanType = new Boolean()
      if (!booleanType.canBeAssigned(conditionCheck.currentType))
        return newResult(null, [new BadOperandTypesError(node.conditionalExpression.location)])
      const consequentCheck = typeCheckBody(node.consequentExpression, frame)
      if (consequentCheck.hasErrors) return consequentCheck
      if (!consequentCheck.currentType)
        throw new Error('Type missing in ternary expresion consequent expression.')
      const alternateCheck = typeCheckBody(node.alternateExpression, frame)
      if (alternateCheck.hasErrors) return alternateCheck
      if (!alternateCheck.currentType)
        throw new Error('Type missing in ternary expresion alternate expression.')
      if (consequentCheck.currentType.canBeAssigned(alternateCheck.currentType))
        return newResult(consequentCheck.currentType)
      if (alternateCheck.currentType.canBeAssigned(consequentCheck.currentType))
        return newResult(alternateCheck.currentType)
      return newResult(null, [new BadOperandTypesError(node.alternateExpression.location)])
    }
    case 'WhileStatement': {
      const expressionCheck = typeCheckBody(node.expression, frame)
      if (expressionCheck.hasErrors) return expressionCheck
      if (!expressionCheck.currentType)
        throw new Error('Type missing in ternary expresion condition.')
      const booleanType = new Boolean()
      if (!booleanType.canBeAssigned(expressionCheck.currentType))
        return newResult(null, [new BadOperandTypesError(node.expression.location)])
      const newFrame = frame.newChildFrame()
      const bodyCheck = typeCheckBody(node.statement, newFrame)
      if (bodyCheck.hasErrors) return bodyCheck
      return OK_RESULT
    }
    default:
      throw new Error(`Check is not implemented for this type of node ${node.kind}.`)
  }
}

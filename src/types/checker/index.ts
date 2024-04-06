import { Array as ArrayType } from '../types/arrays'
import { Integer, String } from '../types/nonPrimitives'
import { Node } from '../ast/types'
import { Type } from '../types/type'
import {
  ArrayRequiredError,
  BadOperandTypesError,
  IncompatibleTypesError,
  NotApplicableToExpressionTypeError,
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
import { Method } from '../types/methods'
import { Frame } from './environment'
import { addClassesToFrame, resolveClassRelationships } from './prechecks'

export type Result = {
  currentType: Type | null
  errors: Error[]
}

export const newResult = (currentType: Type | null = null, errors: Error[] = []): Result => ({
  currentType,
  errors
})

export const OK_RESULT: Result = newResult(null)

export const check = (node: Node, frame: Frame = Frame.globalFrame()): Result => {
  const typeCheckingFrame = frame.newChildFrame()
  const addClassesResult = addClassesToFrame(node, typeCheckingFrame)
  if (addClassesResult.errors.length > 0) return addClassesResult
  const resolveClassesResult = resolveClassRelationships(node, typeCheckingFrame)
  if (resolveClassesResult.errors.length > 0) return resolveClassesResult
  return typeCheckBody(node, typeCheckingFrame)
}

export const typeCheckBody = (node: Node, frame: Frame = Frame.globalFrame()): Result => {
  switch (node.kind) {
    case 'ArrayAccess': {
      const primaryCheck = typeCheckBody(node.primary, frame)
      if (primaryCheck.errors.length > 0) return newResult(null, primaryCheck.errors)
      if (!(primaryCheck.currentType instanceof ArrayType))
        return newResult(null, [new ArrayRequiredError()])
      const expressionCheck = typeCheckBody(node.expression, frame)
      if (expressionCheck.errors.length > 0) return newResult(null, expressionCheck.errors)
      if (!expressionCheck.currentType) throw new Error('Expression check should return a type.')
      const integerType = new Integer()
      const intType = new Int()
      if (
        !(
          integerType.equals(expressionCheck.currentType) ||
          intType.equals(expressionCheck.currentType)
        )
      )
        return newResult(null, [new IncompatibleTypesError()])
      return newResult(primaryCheck.currentType.getContentType())
    }
    case 'ArrayCreationExpression': {
      let type = frame.getType(node.type)
      if (type instanceof Error) return newResult(null, [type])
      if (node.dimensionExpressions) {
        const dimensionExpressionErrors: Error[] = []
        node.dimensionExpressions.forEach(dimensionExpression => {
          const checkResult = typeCheckBody(dimensionExpression.expression, frame)
          if (checkResult.errors.length > 0)
            return dimensionExpressionErrors.push(...checkResult.errors)
          const dimensionExpressionType = checkResult.currentType
          const integerType = new Integer()
          const intType = new Int()
          if (
            !integerType.equals(dimensionExpressionType) &&
            !intType.equals(dimensionExpressionType)
          )
            return dimensionExpressionErrors.push(new IncompatibleTypesError())
          type = new ArrayType(type as Type)
        })
      }
      if (node.arrayInitializer) {
        const arrayType = createArrayType(type, node.arrayInitializer, expression => {
          const result = typeCheckBody(expression, frame)
          if (result.errors.length > 0) return result.errors[0]
          if (!result.currentType)
            throw new Error('array initializer expression should have a type')
          return result.currentType
        })
        if (arrayType instanceof Error) return newResult(null, [arrayType])
      }
      return newResult(type)
    }
    case 'Assignment': {
      const leftCheck = typeCheckBody(node.left, frame)
      if (leftCheck.errors.length > 0) return newResult(null, leftCheck.errors)
      if (!leftCheck.currentType) throw new Error('Left type in assignment should exist.')
      const right = node.right
      const leftType = leftCheck.currentType
      if (leftType instanceof Error) return newResult(null, [leftType])
      const { currentType, errors } = typeCheckBody(right, frame)
      if (errors.length > 0) return newResult(null, errors)
      if (!currentType) throw new Error('Right side of assignment statment should return a type.')
      if (!leftType.canBeAssigned(currentType))
        return newResult(null, [new IncompatibleTypesError()])
      return OK_RESULT
    }
    case 'BasicForStatement': {
      const errors: Error[] = []
      let forConditionFrame: Frame
      if (Array.isArray(node.forInit)) {
        forConditionFrame = frame
        node.forInit.forEach(forInit => {
          const forInitCheck = typeCheckBody(forInit, forConditionFrame)
          errors.push(...forInitCheck.errors)
        })
      } else {
        forConditionFrame = frame.newChildFrame()
        const preCheckErrors = node.forInit.variableDeclaratorList.reduce(
          (errors, { variableDeclaratorId }) =>
            frame.isVariableInFrame(variableDeclaratorId)
              ? [...errors, new VariableAlreadyDefinedError()]
              : errors,
          []
        )
        if (preCheckErrors.length > 0) {
          errors.push(...preCheckErrors)
        } else {
          const forInitCheck = typeCheckBody(node.forInit, forConditionFrame)
          errors.push(...forInitCheck.errors)
        }
      }
      if (node.condition) {
        const conditionCheck = typeCheckBody(node.condition, forConditionFrame)
        errors.push(...conditionCheck.errors)
      }
      node.forUpdate.forEach(forUpdate => {
        const checkResult = typeCheckBody(forUpdate, forConditionFrame)
        errors.push(...checkResult.errors)
      })
      const forBodyFrame = forConditionFrame.newChildFrame()
      const bodyCheck = typeCheckBody(node.body, forBodyFrame)
      if (bodyCheck.errors) errors.push(...bodyCheck.errors)
      return newResult(null, errors)
    }
    case 'BinaryExpression': {
      const { left, operator, right } = node
      const { currentType: leftType, errors: leftErrors } = typeCheckBody(left, frame)
      if (leftErrors.length > 0) return { currentType: null, errors: leftErrors }
      const { currentType: rightType, errors: rightErrors } = typeCheckBody(right, frame)
      if (rightErrors.length > 0) return { currentType: null, errors: rightErrors }
      if (!leftType || !rightType)
        throw new Error('Left and right of binary expression should have a type.')

      const doubleType = new Double()
      switch (operator) {
        case '+':
          if (leftType instanceof String && rightType instanceof String)
            return newResult(new String())
          if (doubleType.canBeAssigned(leftType) && rightType instanceof String)
            return newResult(new String())
          if (leftType instanceof String && doubleType.canBeAssigned(rightType))
            return newResult(new String())
        case '-':
        case '*':
        case '/':
          if (leftType instanceof String && rightType instanceof String)
            return newResult(null, [new BadOperandTypesError()])
          if (leftType.canBeAssigned(rightType)) return newResult(leftType)
          if (rightType.canBeAssigned(leftType)) return newResult(rightType)
          return newResult(null, [new BadOperandTypesError()])
        case '<':
        case '>':
        case '<=':
        case '>=':
          if (doubleType.canBeAssigned(leftType) && doubleType.canBeAssigned(rightType))
            return newResult(new Boolean())
          return newResult(null, [new BadOperandTypesError()])
        case '&&':
        case '||':
          const booleanType = new Boolean()
          if (booleanType.canBeAssigned(leftType) && booleanType.canBeAssigned(rightType))
            return newResult(new Boolean())
          return newResult(null, [new BadOperandTypesError()])
        case '==':
          if (leftType.canBeAssigned(rightType) || rightType.canBeAssigned(leftType))
            return newResult(new Boolean())
          return newResult(null, [new BadOperandTypesError()])
        default:
          throw new Error(`Unrecgonized operator ${operator} found in binary expression.`)
      }
    }
    case 'Block': {
      const errors: Error[] = []
      const newFrame = frame.newChildFrame()
      node.blockStatements.forEach(statement => {
        const result = typeCheckBody(statement, newFrame)
        if (result.errors) errors.push(...result.errors)
      })
      return newResult(null, errors)
    }
    case 'BreakStatement': {
      return OK_RESULT
    }
    case 'ClassInstanceCreationExpression': {
      const classType = frame.getType(node.identifier)
      if (classType instanceof Error) return newResult(null, [classType])
      if (!(classType instanceof ClassImpl)) throw new Error('ClassImpl instance was expected')
      const errors: Error[] = []
      const argumentTypes: Type[] = []
      for (const argument of node.argumentList) {
        const argumentResult = typeCheckBody(argument, frame)
        if (argumentResult.errors.length > 0) {
          errors.push(...argumentResult.errors)
          continue
        }
        if (!argumentResult.currentType) throw new Error('Arguments should have a type.')
        argumentTypes.push(argumentResult.currentType)
      }
      if (errors.length > 0) return newResult(null, errors)
      const argumentList = createArgumentList(...argumentTypes)
      if (argumentList instanceof Error) return newResult(null, [argumentList])
      const constructor = classType.accessConstructor()
      if (!constructor) throw new Error('constructor should not be null')
      const returnType = constructor.invoke(argumentList)
      if (returnType instanceof Error) return newResult(null, [returnType])
      return newResult(returnType)
    }
    case 'CompilationUnit': {
      const errors: Error[] = []
      for (const classDeclaration of node.topLevelClassOrInterfaceDeclarations) {
        const result = typeCheckBody(classDeclaration, frame)
        if (result.errors.length > 0) errors.push(...result.errors)
      }
      if (errors.length > 0) return newResult(null, errors)
      return OK_RESULT
    }
    case 'ContinueStatement': {
      return OK_RESULT
    }
    case 'EmptyStatement': {
      return OK_RESULT
    }
    case 'EnhancedForStatement': {
      const variableType = frame.getType(node.localVariableType)
      if (variableType instanceof Error) return newResult(null, [variableType])
      const expressionCheck = typeCheckBody(node.expression, frame)
      if (expressionCheck.errors.length > 0) return newResult(null, expressionCheck.errors)
      const expressionType = expressionCheck.currentType
      if (!(expressionType instanceof ArrayType))
        return newResult(null, [new NotApplicableToExpressionTypeError()])
      const arrayContentType = expressionType.getContentType()
      if (!variableType.canBeAssigned(arrayContentType))
        return newResult(null, [new IncompatibleTypesError()])
      const forExpressionFrame = frame.newChildFrame()
      const error = forExpressionFrame.setVariable(node.variableDeclaratorId, variableType)
      if (error) return newResult(null, [error])
      const statementCheck = typeCheckBody(node.statement, forExpressionFrame)
      if (statementCheck.errors.length > 0) return newResult(null, statementCheck.errors)
      return OK_RESULT
    }
    case 'ExpressionName': {
      const type = frame.getVariable(node.name)
      if (type instanceof Error) return newResult(null, [type])
      return newResult(type)
    }
    case 'ExpressionStatement': {
      return typeCheckBody(node.stmtExp, frame)
    }
    case 'FieldAccess': {
      const checkPrimary = typeCheckBody(node.primary, frame)
      if (checkPrimary.errors.length > 0) return newResult(null, checkPrimary.errors)
      const primaryType = checkPrimary.currentType
      if (!primaryType) throw new Error('cannot access field of no type')
      const fieldType = primaryType.accessField(node.identifier)
      if (fieldType instanceof Error) return newResult(null, [fieldType])
      return newResult(fieldType)
    }
    case 'IfStatement': {
      const errors: Error[] = []
      const conditionResult = typeCheckBody(node.condition, frame)
      if (conditionResult.errors) errors.push(...conditionResult.errors)
      const booleanType = new Boolean()
      if (conditionResult.currentType && !booleanType.canBeAssigned(conditionResult.currentType))
        errors.push(new IncompatibleTypesError())
      const newFrame = frame.newChildFrame()
      const consequentResult = typeCheckBody(node.consequent, newFrame)
      if (consequentResult.errors) errors.push(...consequentResult.errors)
      return newResult(null, errors)
    }
    case 'Literal': {
      const {
        literalType: { kind, value }
      } = node
      switch (kind) {
        case 'BinaryIntegerLiteral':
        case 'DecimalIntegerLiteral':
        case 'HexIntegerLiteral':
        case 'OctalIntegerLiteral': {
          const Type = getNumberType(value) === 'long' ? Long : Int
          const type = Type.from(value)
          return type instanceof Error ? newResult(null, [type]) : newResult(type)
        }
        case 'DecimalFloatingPointLiteral':
        case 'HexadecimalFloatingPointLiteral': {
          const Type = getFloatType(value) === 'float' ? Float : Double
          const type = Type.from(value)
          return type instanceof Error ? newResult(null, [type]) : newResult(type)
        }
        case 'BooleanLiteral': {
          const type = Boolean.from(value)
          return type instanceof Error ? newResult(null, [type]) : newResult(type)
        }
        case 'CharacterLiteral': {
          const type = Char.from(value)
          return type instanceof Error ? newResult(null, [type]) : newResult(type)
        }
        case 'NullLiteral':
          return newResult(Null.from(value))
        case 'StringLiteral':
          return newResult(String.from(value))
        default:
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          throw new Error(`Unrecgonized literal type ${kind} found in literal.`)
      }
    }
    case 'LocalVariableDeclarationStatement': {
      if (!node.variableDeclaratorList) throw new Error('Variable declarator list is undefined.')
      const errors: Error[] = []
      for (const variableDeclarator of node.variableDeclaratorList) {
        const declaredType = frame.getType(node.localVariableType)
        if (declaredType instanceof Error) return newResult(null, [declaredType])
        if (variableDeclarator.variableInitializer) {
          const type = createArrayType(
            declaredType,
            variableDeclarator.variableInitializer,
            expression => {
              const result = typeCheckBody(expression, frame)
              if (result.errors.length > 0) return result.errors[0]
              if (!result.currentType)
                throw new Error('array initializer expression should have a type')
              return result.currentType
            }
          )
          if (type instanceof Error) errors.push(type)
        }
        const error = frame.setVariable(variableDeclarator.variableDeclaratorId, declaredType)
        if (error) errors.push(error)
      }
      return newResult(null, errors)
    }
    case 'MethodInvocation': {
      const errors: Error[] = []
      let method: Method | Error
      if (node.primary) {
        const primaryCheck = typeCheckBody(node.primary, frame)
        if (primaryCheck.errors.length > 0) return newResult(null, primaryCheck.errors)
        if (!primaryCheck.currentType) throw new Error('primary check should return a type')
        method = primaryCheck.currentType.accessMethod(node.identifier)
      } else {
        method = frame.getMethod(node.identifier)
      }
      if (method instanceof Error) return newResult(null, [method])
      const argumentTypes: Type[] = []
      for (const argument of node.argumentList) {
        const argumentResult = typeCheckBody(argument, frame)
        if (argumentResult.errors.length > 0) {
          errors.push(...argumentResult.errors)
          continue
        }
        if (!argumentResult.currentType) throw new Error('Arguments should have a type.')
        argumentTypes.push(argumentResult.currentType)
      }
      const argumentList = createArgumentList(...argumentTypes)
      if (argumentList instanceof Error) return newResult(null, [...errors, argumentList])
      const returnType = method.invoke(argumentList)
      if (returnType instanceof Error) return newResult(null, [...errors, returnType])
      return newResult(returnType, errors)
    }
    case 'NormalClassDeclaration': {
      const errors: Error[] = []
      const classType = frame.getType(node.typeIdentifier)
      if (classType instanceof Error) return newResult(null, [classType])
      if (!(classType instanceof ClassImpl))
        throw new Error('class type retrieved should be ClassImpl')

      const classFrame = frame.newChildFrame()
      classType.mapFields((name, type) => {
        const error = classFrame.setVariable(name, type)
        if (error) errors.push(error)
      })
      classType.mapMethods((name, method) => {
        const error = classFrame.setMethod(name, method)
        if (error) errors.push(error)
      })
      if (errors.length > 0) return newResult(null, errors)

      let numFieldDeclarations = 0
      let numMethodDeclarations = 0
      for (let i = 0; i < node.classBody.length; i++) {
        const bodyDeclaration = node.classBody[i]

        switch (bodyDeclaration.kind) {
          case 'ConstructorDeclaration': {
            const constructor = classType.accessConstructor()
            if (!constructor) throw new Error('ClassImpl should have a constructor')
            const signature = constructor.getOverload(
              i - numFieldDeclarations - numMethodDeclarations
            )
            const methodFrame = classFrame.newChildFrame()
            const constructorMethodErrors: Error[] = []
            signature.mapParameters((name, type, isVarargs) => {
              if (isVarargs) type = new ArrayType(type)
              const error = methodFrame.setVariable(name, type)
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
            for (const variableDeclarator of bodyDeclaration.variableDeclaratorList) {
              const field = classType.accessField(variableDeclarator.variableDeclaratorId)
              if (field instanceof Error) throw new Error('field should exist in class')
              const initializer = variableDeclarator.variableInitializer
              if (initializer) {
                const type = createArrayType(field, initializer, expression => {
                  const result = typeCheckBody(expression, frame)
                  if (result.errors.length > 0) return result.errors[0]
                  if (!result.currentType)
                    throw new Error('array initializer expression should have a type')
                  return result.currentType
                })
                if (type instanceof Error) errors.push(type)
              }
            }
            break
          }
          case 'MethodDeclaration': {
            const methodName = bodyDeclaration.methodHeader.identifier
            const method = classType.accessMethod(methodName)
            if (method instanceof Error) throw new Error('ClassImpl should have the method')
            const overloadIndex = node.classBody
              .filter(node => {
                return (
                  node.kind === 'MethodDeclaration' && node.methodHeader.identifier === methodName
                )
              })
              .findIndex(node => node === bodyDeclaration)
            const signature = method.getOverload(overloadIndex)

            const methodFrame = classFrame.newChildFrame()
            const methodErrors: Error[] = []
            methodFrame.setReturnType(signature.getReturnType())
            signature.mapParameters((name, type, isVarargs) => {
              if (isVarargs) type = new ArrayType(type)
              const error = methodFrame.setVariable(name, type)
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
    case 'PostfixExpression': {
      const expressionCheck = typeCheckBody(node.expression, frame)
      if (expressionCheck.errors.length > 0) return expressionCheck
      const doubleType = new Double()
      if (!expressionCheck.currentType) throw new Error('Expression check did not return a type.')
      if (!doubleType.canBeAssigned(expressionCheck.currentType))
        return newResult(null, [new BadOperandTypesError()])
      return expressionCheck
    }
    case 'PrefixExpression': {
      const { operator, expression } = node
      switch (operator) {
        case '-': {
          if (expression.kind === 'Literal') {
            switch (expression.literalType.kind) {
              case 'BinaryIntegerLiteral':
              case 'DecimalFloatingPointLiteral':
              case 'DecimalIntegerLiteral':
              case 'HexIntegerLiteral':
              case 'OctalIntegerLiteral':
              case 'HexadecimalFloatingPointLiteral': {
                expression.literalType.value = '-' + expression.literalType.value
                return typeCheckBody(expression, frame)
              }
              case 'BooleanLiteral':
              case 'CharacterLiteral':
              case 'StringLiteral':
              case 'NullLiteral':
                return newResult(null, [new BadOperandTypesError()])
            }
          }
        }
        case '+':
          return typeCheckBody(expression, frame)
        case '!':
          const expressionCheck = typeCheckBody(expression, frame)
          if (expressionCheck.errors.length > 0) return expressionCheck
          if (!expressionCheck.currentType) throw new Error('Type missing in ! prefix expression.')
          const booleanType = new Boolean()
          if (booleanType.canBeAssigned(expressionCheck.currentType)) return newResult(booleanType)
          return newResult(null, [new BadOperandTypesError()])
        default:
          throw new Error(`Unrecgonized operator ${operator} found in prefix expression.`)
      }
    }
    case 'ReturnStatement': {
      const expressionCheck = typeCheckBody(node.exp, frame)
      if (expressionCheck.errors.length > 0) return expressionCheck
      if (!expressionCheck.currentType) throw new Error('Expression check should return a type.')
      const returnType = frame.getReturn()
      if (returnType instanceof Error) return newResult(null, [returnType])
      if (!returnType.canBeAssigned(expressionCheck.currentType))
        return newResult(null, [new IncompatibleTypesError()])
      return OK_RESULT
    }
    case 'TernaryExpression': {
      const conditionCheck = typeCheckBody(node.condition, frame)
      if (conditionCheck.errors.length > 0) return conditionCheck
      if (!conditionCheck.currentType)
        throw new Error('Type missing in ternary expresion condition.')
      const booleanType = new Boolean()
      if (!booleanType.canBeAssigned(conditionCheck.currentType))
        return newResult(null, [new BadOperandTypesError()])
      const consequentCheck = typeCheckBody(node.consequent, frame)
      if (consequentCheck.errors.length > 0) return conditionCheck
      if (!consequentCheck.currentType)
        throw new Error('Type missing in ternary expresion consequent expression.')
      const alternateCheck = typeCheckBody(node.alternate, frame)
      if (alternateCheck.errors.length > 0) return conditionCheck
      if (!alternateCheck.currentType)
        throw new Error('Type missing in ternary expresion alternate expression.')
      if (consequentCheck.currentType.canBeAssigned(alternateCheck.currentType))
        return newResult(consequentCheck.currentType)
      if (alternateCheck.currentType.canBeAssigned(consequentCheck.currentType))
        return newResult(alternateCheck.currentType)
      return newResult(null, [new BadOperandTypesError()])
    }
    case 'WhileStatement': {
      const conditionCheck = typeCheckBody(node.condition, frame)
      if (conditionCheck.errors.length > 0) return conditionCheck
      if (!conditionCheck.currentType)
        throw new Error('Type missing in ternary expresion condition.')
      const booleanType = new Boolean()
      if (!booleanType.canBeAssigned(conditionCheck.currentType))
        return newResult(null, [new BadOperandTypesError()])
      const newFrame = frame.newChildFrame()
      const bodyCheck = typeCheckBody(node.body, newFrame)
      if (bodyCheck.errors.length > 0) return bodyCheck
      return OK_RESULT
    }
    default:
      throw new Error(`Check is not implemented for this type of node ${node.kind}.`)
  }
}

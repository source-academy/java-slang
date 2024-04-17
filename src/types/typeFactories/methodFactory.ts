import {
  ArgumentList,
  ClassMethod,
  Method,
  MethodSignature,
  Parameter,
  ParameterList
} from '../types/methods'
import {
  ConstructorDeclaration,
  FormalParameter,
  MethodDeclaration
} from '../ast/specificationTypes'
import { Frame } from '../checker/environment'
import { Type } from '../types/type'
import {
  TypeCheckerError,
  VarargsParameterMustBeLastParameter,
  VariableAlreadyDefinedError
} from '../errors'
import { unannTypeToString } from '../ast/utils'

export const createArgumentList = (...argumentTypes: Type[]): ArgumentList | TypeCheckerError => {
  const argumentList = new ArgumentList()
  argumentTypes.forEach(argumentType => {
    argumentList.addArgument(argumentType)
  })
  return argumentList
}

const createParameterList = (
  frame: Frame,
  ...parameterDeclarations: FormalParameter[]
): ParameterList | TypeCheckerError => {
  const identifiers = new Set<string>()
  const parameters: ParameterList = new ParameterList()
  for (let i = 0; i < parameterDeclarations.length; i++) {
    const parameterDeclaration = parameterDeclarations[i]
    if (
      parameterDeclaration.kind === 'VariableArityParameter' &&
      i + 1 !== parameterDeclarations.length
    )
      return new VarargsParameterMustBeLastParameter(parameterDeclaration.location)
    const parameterType = frame.getType(
      unannTypeToString(parameterDeclaration.unannType),
      parameterDeclaration.unannType.location
    )
    if (parameterType instanceof TypeCheckerError) return parameterType
    const identifier =
      parameterDeclaration.kind === 'FormalParameter'
        ? parameterDeclaration.variableDeclaratorId.identifier.identifier
        : parameterDeclaration.identifier.identifier
    if (identifiers.has(identifier)) return new VariableAlreadyDefinedError()
    identifiers.add(identifier)
    const parameter = new Parameter(
      identifier,
      parameterType,
      parameterDeclaration.kind === 'VariableArityParameter'
    )
    parameters.addParameter(parameter)
  }
  return parameters
}

export const createMethodSignature = (
  frame: Frame,
  node: MethodDeclaration | ConstructorDeclaration
): MethodSignature | TypeCheckerError => {
  const methodSignature = new ClassMethod()
  const returnType = frame.getType(
    node.kind === 'MethodDeclaration'
      ? unannTypeToString(node.methodHeader.result)
      : node.constructorDeclarator.simpleTypeName.identifier,
    node.kind === 'MethodDeclaration'
      ? node.methodHeader.result.location
      : node.constructorDeclarator.simpleTypeName.location
  )
  if (returnType instanceof TypeCheckerError) return returnType
  const parameterList =
    node.kind === 'MethodDeclaration'
      ? node.methodHeader.methodDeclarator.formalParameterList?.formalParameters || []
      : node.constructorDeclarator.formalParameterList?.formalParameters || []
  const parameters = createParameterList(frame, ...parameterList)
  if (parameters instanceof TypeCheckerError) return parameters
  const modifier: string[] =
    node.kind === 'MethodDeclaration'
      ? node.methodModifiers.map(modifier => modifier.identifier)
      : node.constructorModifiers.map(modifier => modifier.identifier)
  methodSignature.modifiers.push(...modifier)
  methodSignature.parameters = parameters
  methodSignature.returnType = returnType
  // TODO: Add exceptions for method signatures
  return methodSignature
}

export const createMethod = (
  frame: Frame,
  node: MethodDeclaration | ConstructorDeclaration
): Method | TypeCheckerError => {
  const methodSignature = createMethodSignature(frame, node)
  if (methodSignature instanceof TypeCheckerError) return methodSignature
  return new Method(methodSignature)
}

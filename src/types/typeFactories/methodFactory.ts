import { Method, Parameter } from '../types/methods'
import { ConstructorDeclaration, Identifier, MethodDeclaration } from '../ast/specificationTypes'
import { Frame } from '../checker/environment'
import {
  TypeCheckerError,
  VarargsParameterMustBeLastParameter,
  VariableAlreadyDefinedError
} from '../errors'
import { unannTypeToString } from '../ast/utils'

export const createMethod = (
  frame: Frame,
  node: MethodDeclaration | ConstructorDeclaration
): Method | TypeCheckerError => {
  const methodName =
    node.kind === 'MethodDeclaration'
      ? node.methodHeader.methodDeclarator.identifier.identifier
      : node.constructorDeclarator.simpleTypeName.identifier
  const returnType = frame.getType(
    node.kind === 'MethodDeclaration'
      ? unannTypeToString(node.methodHeader.result)
      : node.constructorDeclarator.simpleTypeName.identifier,
    node.kind === 'MethodDeclaration'
      ? node.methodHeader.result.location
      : node.constructorDeclarator.simpleTypeName.location
  )
  if (returnType instanceof TypeCheckerError) return returnType
  const method = new Method(methodName, returnType)
  const modifiers: Identifier[] =
    node.kind === 'MethodDeclaration' ? node.methodModifiers : node.constructorModifiers
  for (const modifier of modifiers) {
    const error = method.addModifier(modifier)
    if (error instanceof TypeCheckerError) return error
  }

  const parameterDeclarations =
    node.kind === 'MethodDeclaration'
      ? node.methodHeader.methodDeclarator.formalParameterList?.formalParameters || []
      : node.constructorDeclarator.formalParameterList?.formalParameters || []
  const identifiers = new Set<string>()
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
        ? parameterDeclaration.variableDeclaratorId.identifier
        : parameterDeclaration.identifier
    if (identifiers.has(identifier.identifier))
      return new VariableAlreadyDefinedError(identifier.location)
    identifiers.add(identifier.identifier)
    const parameter = new Parameter(
      identifier.identifier,
      parameterType,
      parameterDeclaration.kind === 'VariableArityParameter'
    )
    const error = method.addParameter(parameter)
    if (error instanceof TypeCheckerError) return error
  }

  // TODO: Add exceptions for method signatures
  return method
}

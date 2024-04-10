import {
  ArgumentList,
  ClassMethod,
  Method,
  MethodSignature,
  Parameter,
  ParameterList
} from '../types/methods'
import { ConstructorDeclaration, FormalParameter, MethodDeclaration } from '../ast/types/classes'
import { Frame } from '../checker/environment'
import { Type } from '../types/type'
import { VarargsParameterMustBeLastParameter, VariableAlreadyDefinedError } from '../errors'

export const createArgumentList = (...argumentTypes: Type[]): ArgumentList | Error => {
  const argumentList = new ArgumentList()
  argumentTypes.forEach(argumentType => {
    argumentList.addArgument(argumentType)
  })
  return argumentList
}

const createParameterList = (
  frame: Frame,
  ...parameterDeclarations: FormalParameter[]
): ParameterList | Error => {
  const identifiers = new Set<string>()
  const parameters: ParameterList = new ParameterList()
  for (let i = 0; i < parameterDeclarations.length; i++) {
    const parameterDeclaration = parameterDeclarations[i]
    if (parameterDeclaration.isVariableArityParameter && i + 1 !== parameterDeclarations.length)
      return new VarargsParameterMustBeLastParameter()
    const parameterType = frame.getType(parameterDeclaration.unannType)
    if (parameterType instanceof Error) return parameterType
    if (identifiers.has(parameterDeclaration.identifier)) return new VariableAlreadyDefinedError()
    identifiers.add(parameterDeclaration.identifier)
    const parameter = new Parameter(
      parameterDeclaration.identifier,
      parameterType,
      parameterDeclaration.isVariableArityParameter
    )
    parameters.addParameter(parameter)
  }
  return parameters
}

export const createMethodSignature = (
  frame: Frame,
  node: MethodDeclaration | ConstructorDeclaration
): MethodSignature | Error => {
  const methodSignature = new ClassMethod()
  const returnType = frame.getType(
    node.kind === 'MethodDeclaration'
      ? node.methodHeader.result
      : node.constructorDeclarator.identifier
  )
  if (returnType instanceof Error) return returnType
  const parameterList =
    node.kind === 'MethodDeclaration'
      ? node.methodHeader.formalParameterList
      : node.constructorDeclarator.formalParameterList
  const parameters = createParameterList(frame, ...parameterList)
  if (parameters instanceof Error) return parameters
  const modifier: string[] =
    node.kind === 'MethodDeclaration' ? node.methodModifier : node.constructorModifier
  methodSignature.modifiers.push(...modifier)
  methodSignature.parameters = parameters
  methodSignature.returnType = returnType
  // TODO: Add exceptions for method signatures
  return methodSignature
}

export const createMethod = (
  frame: Frame,
  node: MethodDeclaration | ConstructorDeclaration
): Method | Error => {
  const methodSignature = createMethodSignature(frame, node)
  if (methodSignature instanceof Error) return methodSignature
  return new Method(methodSignature)
}

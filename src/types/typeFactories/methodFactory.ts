import {
  ArgumentList,
  ClassMethod,
  Method,
  MethodSignature,
  Parameter,
  ParameterList
} from '../types/methods'
import { FormalParameter, MethodDeclaration } from '../ast/types/classes'
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
  node: MethodDeclaration
): MethodSignature | Error => {
  const methodSignature = new ClassMethod()
  const returnType = frame.getType(node.methodHeader.result)
  if (returnType instanceof Error) return returnType
  const parameters = createParameterList(frame, ...node.methodHeader.formalParameterList)
  if (parameters instanceof Error) return parameters
  methodSignature.modifiers.push(...node.methodModifier)
  methodSignature.parameters = parameters
  methodSignature.returnType = returnType
  // TODO: Add exceptions for method signatures
  return methodSignature
}

export const createMethod = (frame: Frame, node: MethodDeclaration): Method | Error => {
  const methodSignature = createMethodSignature(frame, node)
  if (methodSignature instanceof Error) return methodSignature
  return new Method(methodSignature)
}

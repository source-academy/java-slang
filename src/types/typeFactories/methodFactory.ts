import { FormalParameter, MethodDeclaration } from '../ast/types/classes'
import { Frame } from '../checker/environment'
import { Type } from '../types/type'
import {
  ArgumentList,
  ClassMethod,
  Method,
  MethodSignature,
  Parameter,
  ParameterList
} from '../types/methods'

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
  const parameters: ParameterList = new ParameterList()
  for (const parameterDeclaration of parameterDeclarations) {
    const parameterType = frame.getType(parameterDeclaration.unannType)
    if (parameterType instanceof Error) return parameterType
    const parameter = new Parameter(parameterDeclaration.identifier, parameterType)
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

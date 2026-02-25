import { Node } from '../ast/types/ast'
import {
  BlockStatement,
  DecimalIntegerLiteral,
  Expression,
  ExpressionStatement,
  Literal,
  MethodInvocation,
  ReturnStatement
} from '../ast/types/blocks-and-statements'
import {
  ConstructorDeclaration,
  FieldDeclaration,
  MethodDeclaration,
  NormalClassDeclaration,
  UnannType
} from '../ast/types/classes'
import { EnvNode } from './components'
import { THIS_KEYWORD } from './constants'
import * as errors from './errors'
import {
  emptyReturnStmtNode,
  expConInvNode,
  expStmtAssmtNode,
  exprNameNode,
  nullLitNode,
  returnThisStmtNode
} from './nodeCreator'
import { ControlItem, Context, Instr, Class, Type, Closure, StashItem } from './types'

/**
 * Components.
 */
interface IStack<T> {
  push(...items: T[]): void
  pop(): T | undefined
  peek(): T | undefined
  size(): number
  isEmpty(): boolean
  getStack(): T[]
}

export class Stack<T> implements IStack<T> {
  private storage: T[] = []

  public push(...items: T[]): void {
    for (const item of items) {
      this.storage.push(item)
    }
  }

  public pop(): T | undefined {
    return this.storage.pop()
  }

  public peek(): T | undefined {
    if (this.isEmpty()) {
      return undefined
    }
    return this.storage[this.size() - 1]
  }

  public peekN(n: number): T | undefined {
    if (this.isEmpty()) {
      return undefined
    }
    return this.storage[this.size() - n]
  }

  public size(): number {
    return this.storage.length
  }

  public isEmpty(): boolean {
    return this.size() == 0
  }

  public getStack(): T[] {
    // Return copy instead of original.
    return [...this.storage]
  }
}

export const isInstr = (command: ControlItem): command is Instr => {
  return (command as Instr).instrType !== undefined
}

export const isNode = (command: ControlItem): command is Node => {
  return (command as Node).kind !== undefined
}

export const handleSequence = (seq: ControlItem[]): ControlItem[] => {
  // Create copy so that original is not mutated.
  const result: ControlItem[] = []
  for (const command of seq) {
    result.push(command)
  }
  return result.reverse()
}

/**
 * Errors
 */
export const handleRuntimeError = (context: Context, error: errors.RuntimeError) => {
  context.errors.push(error)
  throw error
}

/**
 * Binary Expressions
 */
export const evaluateBinaryExpression = (
  operator: string,
  left: Literal,
  right: Literal
): Literal => {
  switch (operator) {
    case '+':
      return {
        kind: 'Literal',
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) + Number(right.literalType.value))
        } as DecimalIntegerLiteral
      }
    case '-':
      return {
        kind: 'Literal',
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) - Number(right.literalType.value))
        } as DecimalIntegerLiteral
      }
    case '*':
      return {
        kind: 'Literal',
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) * Number(right.literalType.value))
        } as DecimalIntegerLiteral
      }
    case '/':
      return {
        kind: 'Literal',
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) / Number(right.literalType.value))
        } as DecimalIntegerLiteral
      }
    default:
      /* case "%" */ return {
        kind: 'Literal',
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) % Number(right.literalType.value))
        } as DecimalIntegerLiteral
      }
  }
}

/**
 * Default values.
 */
export const defaultValues = new Map<UnannType, Literal>([
  [
    'int',
    {
      kind: 'Literal',
      literalType: {
        kind: 'DecimalIntegerLiteral',
        value: '0'
      }
    }
  ]
])

/**
 * Name
 */
export const getDescriptor = (mtdOrCon: MethodDeclaration | ConstructorDeclaration): string => {
  return mtdOrCon.kind === 'MethodDeclaration'
    ? `${mtdOrCon.methodHeader.identifier}(${mtdOrCon.methodHeader.formalParameterList.map(p => p.unannType).join(',')})${mtdOrCon.methodHeader.result}`
    : `${mtdOrCon.constructorDeclarator.identifier}(${mtdOrCon.constructorDeclarator.formalParameterList.map(p => p.unannType).join(',')})`
}

export const isQualified = (name: string) => {
  return name.includes('.')
}

export const isSimple = (name: string) => {
  return !isQualified(name)
}

/**
 * Class
 */
export const getInstanceFields = (c: NormalClassDeclaration): FieldDeclaration[] => {
  return c.classBody.filter(
    m => m.kind === 'FieldDeclaration' && isInstance(m)
  ) as FieldDeclaration[]
}

export const getInstanceMethods = (c: NormalClassDeclaration): MethodDeclaration[] => {
  return c.classBody.filter(
    m => m.kind === 'MethodDeclaration' && isInstance(m)
  ) as MethodDeclaration[]
}

export const getStaticFields = (c: NormalClassDeclaration): FieldDeclaration[] => {
  return c.classBody.filter(m => m.kind === 'FieldDeclaration' && isStatic(m)) as FieldDeclaration[]
}

export const getStaticMethods = (c: NormalClassDeclaration): MethodDeclaration[] => {
  return c.classBody.filter(
    m => m.kind === 'MethodDeclaration' && isStatic(m)
  ) as MethodDeclaration[]
}

export const getConstructors = (c: NormalClassDeclaration): ConstructorDeclaration[] => {
  return c.classBody.filter(m => m.kind === 'ConstructorDeclaration') as ConstructorDeclaration[]
}

export const isStatic = (fieldOrMtd: FieldDeclaration | MethodDeclaration): boolean => {
  return fieldOrMtd.kind === 'FieldDeclaration'
    ? fieldOrMtd.fieldModifier.includes('static')
    : fieldOrMtd.methodModifier.includes('static')
}

export const isInstance = (fieldOrMtd: FieldDeclaration | MethodDeclaration): boolean => {
  return !isStatic(fieldOrMtd)
}

const convertFieldDeclToExpStmtAssmt = (fd: FieldDeclaration): ExpressionStatement => {
  const left = `this.${fd.variableDeclaratorList[0].variableDeclaratorId}`
  // Fields are always initialized to default value if initializer is absent.
  const right = (fd.variableDeclaratorList[0].variableInitializer ||
    defaultValues.get(fd.fieldType) ||
    nullLitNode(fd)) as Expression
  return expStmtAssmtNode(left, right, fd)
}

export const makeMtdInvSimpleIdentifierQualified = (mtd: MethodDeclaration, qualifier: string) => {
  mtd.methodBody.blockStatements.forEach(blockStatement => {
    // MethodInvocation as ExpressionStatement
    blockStatement.kind === 'ExpressionStatement' &&
      blockStatement.stmtExp.kind === 'MethodInvocation' &&
      isSimple(blockStatement.stmtExp.identifier) &&
      (blockStatement.stmtExp.identifier = `${qualifier}.${blockStatement.stmtExp.identifier}`)

    // MethodInvocation as RHS of Assignment ExpressionStatement
    blockStatement.kind === 'ExpressionStatement' &&
      blockStatement.stmtExp.kind === 'Assignment' &&
      blockStatement.stmtExp.right.kind === 'MethodInvocation' &&
      isSimple(blockStatement.stmtExp.right.identifier) &&
      (blockStatement.stmtExp.right.identifier = `${qualifier}.${blockStatement.stmtExp.right.identifier}`)

    // MethodInvocation as VariableInitializer of LocalVariableDeclarationStatement
    blockStatement.kind === 'LocalVariableDeclarationStatement' &&
      blockStatement.variableDeclaratorList[0].variableInitializer &&
      (blockStatement.variableDeclaratorList[0].variableInitializer as Expression).kind ===
        'MethodInvocation' &&
      isSimple(
        (blockStatement.variableDeclaratorList[0].variableInitializer as MethodInvocation)
          .identifier
      ) &&
      ((
        blockStatement.variableDeclaratorList[0].variableInitializer as MethodInvocation
      ).identifier =
        `${qualifier}.${(blockStatement.variableDeclaratorList[0].variableInitializer as MethodInvocation).identifier}`)
  })
}

export const makeNonLocalVarNonParamSimpleNameQualified = (
  mtdOrCon: MethodDeclaration | ConstructorDeclaration,
  qualifier: string
) => {
  const headerOrDeclarator =
    mtdOrCon.kind === 'MethodDeclaration' ? mtdOrCon.methodHeader : mtdOrCon.constructorDeclarator
  const params = headerOrDeclarator.formalParameterList.map(p => p.identifier)
  const localVars = new Set<string>(params)

  const makeSimpleNameQualifiedHelper = (exprOrBlkStmt: Expression | BlockStatement) => {
    switch (exprOrBlkStmt.kind) {
      case 'ExpressionName':
        const exprName = exprOrBlkStmt
        isSimple(exprName.name) &&
          !localVars.has(exprName.name) &&
          (exprName.name = `${qualifier}.${exprName.name}`)
        break
      case 'Assignment':
        const asgn = exprOrBlkStmt
        makeSimpleNameQualifiedHelper(asgn.left)
        makeSimpleNameQualifiedHelper(asgn.right)
        break
      case 'BinaryExpression':
        const binExpr = exprOrBlkStmt
        makeSimpleNameQualifiedHelper(binExpr.left)
        makeSimpleNameQualifiedHelper(binExpr.right)
        break
      case 'LocalVariableDeclarationStatement':
        const localVarDecl = exprOrBlkStmt
        localVarDecl.variableDeclaratorList[0].variableInitializer &&
          makeSimpleNameQualifiedHelper(
            localVarDecl.variableDeclaratorList[0].variableInitializer as Expression
          )
        break
      case 'ExpressionStatement':
        const exprStmt = exprOrBlkStmt
        exprStmt.stmtExp.kind === 'Assignment' && makeSimpleNameQualifiedHelper(exprStmt.stmtExp)
      default:
    }
  }

  const body =
    mtdOrCon.kind === 'MethodDeclaration' ? mtdOrCon.methodBody : mtdOrCon.constructorBody
  body.blockStatements.forEach(blockStatement => {
    // Local var should be added incrementally to ensure correct scoping.
    blockStatement.kind === 'LocalVariableDeclarationStatement' &&
      localVars.add(blockStatement.variableDeclaratorList[0].variableDeclaratorId)

    makeSimpleNameQualifiedHelper(blockStatement)
  })
}

export const prependExpConInvIfNeeded = (
  constructor: ConstructorDeclaration,
  c: NormalClassDeclaration
): void => {
  const conBodyBlockStmts = constructor.constructorBody.blockStatements
  if (c.sclass && !conBodyBlockStmts.some(s => s.kind === 'ExplicitConstructorInvocation')) {
    conBodyBlockStmts.unshift(expConInvNode(constructor))
  }
}

export const prependInstanceFieldsInitIfNeeded = (
  constructor: ConstructorDeclaration,
  instanceFields: FieldDeclaration[]
): void => {
  const conBodyBlockStmts = constructor.constructorBody.blockStatements
  const isAltConInvAbsent = !conBodyBlockStmts.find(
    s => s.kind === 'ExplicitConstructorInvocation' && s.thisOrSuper === THIS_KEYWORD
  )
  if (isAltConInvAbsent) {
    const expStmtAssmts = instanceFields.map(f => convertFieldDeclToExpStmtAssmt(f))
    conBodyBlockStmts.unshift(...expStmtAssmts)
  }
}

export const appendOrReplaceReturn = (constructor: ConstructorDeclaration): void => {
  const conBodyBlockStmts: BlockStatement[] = constructor.constructorBody.blockStatements
  // TODO deep search
  const returnStmt = conBodyBlockStmts.find(
    stmt => stmt.kind === 'ReturnStatement' && stmt.exp.kind === 'Void'
  )
  if (returnStmt) {
    // Replace empty ReturnStatement with ReturnStatement with this keyword.
    ;(returnStmt as ReturnStatement).exp = exprNameNode(THIS_KEYWORD, constructor)
  } else {
    // Add ReturnStatement with this keyword.
    conBodyBlockStmts.push(returnThisStmtNode(constructor))
  }
}

export const appendEmtpyReturn = (method: MethodDeclaration): void => {
  const mtdBodyBlockStmts: BlockStatement[] = method.methodBody.blockStatements
  // TODO deep search
  if (!mtdBodyBlockStmts.find(stmt => stmt.kind === 'ReturnStatement')) {
    // Add empty ReturnStatement if absent.
    mtdBodyBlockStmts.push(emptyReturnStmtNode(method))
  }
}

export const searchMainMtdClass = (classes: NormalClassDeclaration[]) => {
  return classes.find(c =>
    c.classBody.some(
      d =>
        d.kind === 'MethodDeclaration' &&
        d.methodModifier.includes('public') &&
        d.methodModifier.includes('static') &&
        d.methodHeader.result === 'void' &&
        d.methodHeader.identifier === 'main' &&
        d.methodHeader.formalParameterList.length === 1 &&
        d.methodHeader.formalParameterList[0].unannType === 'String[]' &&
        d.methodHeader.formalParameterList[0].identifier === 'args'
    )
  )?.typeIdentifier
}

/**
 * Method overloading and overriding resolution.
 */
const isSubtype = (subtype: UnannType, supertype: UnannType, classStore: EnvNode): boolean => {
  // TODO handle primitive subtyping relation
  if (subtype === 'String[]' || subtype === 'int') return true

  let isSubtype = false

  let subclassSuperclass: Class | undefined = classStore.getClass(subtype).superclass
  const superclass = classStore.getClass(supertype)
  while (subclassSuperclass) {
    if (subclassSuperclass === superclass) {
      isSubtype = true
      break
    }
    subclassSuperclass = subclassSuperclass.superclass
  }

  return isSubtype
}

export const resOverload = (
  classToSearchIn: Class,
  mtdName: string,
  argTypes: Type[],
  classStore: EnvNode
): Closure => {
  // Identify potentially applicable methods.
  const appClosures: Closure[] = []
  let c: Class | undefined = classToSearchIn
  while (c) {
    for (const [closureName, closure] of c.frame.frame.entries()) {
      // Methods contains parantheses and must have return type.
      if (closureName.includes(mtdName + '(') && closureName[closureName.length - 1] !== ')') {
        const params = ((closure as Closure).mtdOrCon as MethodDeclaration).methodHeader
          .formalParameterList

        if (argTypes.length != params.length) continue

        let match = true
        for (let i = 0; i < argTypes.length; i++) {
          match &&=
            argTypes[i].type === params[i].unannType ||
            isSubtype(argTypes[i].type, params[i].unannType, classStore)
          if (!match) break // short circuit
        }

        match && appClosures.push(closure as Closure)
      }
    }

    if (appClosures.length > 0) break

    // Search recursively.
    c = c.superclass
  }

  if (appClosures.length === 0) {
    throw new errors.ResOverloadError(mtdName, argTypes)
  }

  if (appClosures.length === 1) {
    return appClosures[0]
  }

  // Choose most specific method.
  const mostSpecClosuresByParam = new Set<Closure>()
  for (let i = 0; i < argTypes.length; i++) {
    let mostSpecClosureByParam = appClosures[0]
    for (const appClosure of appClosures) {
      const mostSpecParams = (mostSpecClosureByParam.mtdOrCon as MethodDeclaration).methodHeader
        .formalParameterList
      const params = (appClosure.mtdOrCon as MethodDeclaration).methodHeader.formalParameterList
      if (isSubtype(params[i].unannType, mostSpecParams[i].unannType, classStore)) {
        mostSpecClosureByParam = appClosure
      }
    }
    mostSpecClosuresByParam.add(mostSpecClosureByParam)
  }
  const isAmbiguous = mostSpecClosuresByParam.size > 1
  if (isAmbiguous) {
    throw new errors.ResOverloadAmbiguousError(mtdName, argTypes)
  }

  return mostSpecClosuresByParam.values().next().value
}

export const resOverride = (classToSearchIn: Class, overloadResolvedClosure: Closure): Closure => {
  const overloadResolvedMtd = overloadResolvedClosure.mtdOrCon as MethodDeclaration
  const name = overloadResolvedMtd.methodHeader.identifier
  const overloadResolvedClosureParams = overloadResolvedMtd.methodHeader.formalParameterList

  const closures: Closure[] = []
  for (const [closureName, closure] of classToSearchIn.frame.frame.entries()) {
    // Methods contains parantheses and must have return type.
    if (closureName.includes(name + '(') && closureName[closureName.length - 1] !== ')') {
      closures.push(closure as Closure)
    }
  }

  let overrideResolvedClosure = overloadResolvedClosure
  for (const closure of closures) {
    const params = (closure.mtdOrCon as MethodDeclaration).methodHeader.formalParameterList

    if (overloadResolvedClosureParams.length != params.length) continue

    let match = true
    for (let i = 0; i < overloadResolvedClosureParams.length; i++) {
      match &&= params[i].unannType === overloadResolvedClosureParams[i].unannType
      if (!match) break // short circuit
    }

    if (match) {
      overrideResolvedClosure = closure
      break
    }
  }

  return overrideResolvedClosure
}

export const resConOverload = (
  classToSearchIn: Class,
  conName: string,
  argTypes: Type[]
): Closure => {
  const closures: Closure[] = []
  for (const [closureName, closure] of classToSearchIn.frame.frame.entries()) {
    // Constructors contains parantheses and do not have return type.
    if (closureName.includes(conName + '(') && closureName[closureName.length - 1] === ')') {
      closures.push(closure as Closure)
    }
  }

  let resolved: Closure | undefined
  for (const closure of closures) {
    const params = (closure.mtdOrCon as ConstructorDeclaration).constructorDeclarator
      .formalParameterList

    if (argTypes.length != params.length) continue

    let match = true
    for (let i = 0; i < argTypes.length; i++) {
      match &&= params[i].unannType === argTypes[i].type
      if (!match) break // short circuit
    }

    if (match) {
      resolved = closure
      break
    }
  }

  if (!resolved) {
    throw new errors.ResConOverloadError(conName, argTypes)
  }

  return resolved
}

export const isNull = (stashItem: StashItem) => {
  return stashItem.kind === 'Literal' && stashItem.literalType.kind === 'NullLiteral'
}

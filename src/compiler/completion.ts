/**
 * Whether a statement can complete normally (JLS 14.21): control can reach the point after it,
 * rather than every path through it ending in a `return`, a `throw`, a `break` or a `continue`.
 * It is used to tell whether a finally block can complete normally, because a try statement
 * whose finally block cannot only throws what the finally block throws (JLS 11.2.2).
 *
 * The analysis follows the JLS rules for the statements the compiler supports. The condition of
 * a loop is only known to be constant when it is the literal `true`.
 */
export function canCompleteNormally(statement: any): boolean {
  if (statement === null || typeof statement !== 'object') return true

  switch (statement.kind) {
    case 'ReturnStatement':
    case 'ThrowStatement':
    case 'BreakStatement':
    case 'ContinueStatement':
      return false

    case 'Block':
      // a statement that cannot complete normally makes the ones after it unreachable
      return (statement.blockStatements as any[]).every(canCompleteNormally)

    case 'IfStatement':
      // `if (c) s` can complete normally; `if (c) s else t` if either branch can
      return (
        statement.alternate === undefined ||
        statement.alternate === null ||
        canCompleteNormally(statement.consequent) ||
        canCompleteNormally(statement.alternate)
      )

    case 'WhileStatement':
      return !isConstantTrue(statement.condition) || containsBreak(statement.body)

    case 'BasicForStatement':
      return (
        (statement.condition !== undefined &&
          statement.condition !== null &&
          !isConstantTrue(statement.condition)) ||
        containsBreak(statement.body)
      )

    case 'DoStatement':
      return (
        ((canCompleteNormally(statement.body) || containsContinue(statement.body)) &&
          !isConstantTrue(statement.condition)) ||
        containsBreak(statement.body)
      )

    case 'SwitchStatement':
      return switchCanCompleteNormally(statement)

    case 'TryStatement': {
      const catchBlocks: any[] = (statement.catches?.catchClauses ?? []).map(
        (clause: any) => clause.block
      )
      const tryOrCatchCompletes =
        canCompleteNormally(statement.block) || catchBlocks.some(canCompleteNormally)
      const finallyCompletes = !statement.finally || canCompleteNormally(statement.finally.block)
      return tryOrCatchCompletes && finallyCompletes
    }

    default:
      // declarations, expression statements and the other statements complete normally
      return true
  }
}

const isConstantTrue = (expression: any): boolean =>
  expression?.kind === 'Literal' &&
  expression.literalType?.kind === 'BooleanLiteral' &&
  expression.literalType.value === 'true'

/** JLS 14.21: a switch statement can complete normally in any of these cases. */
function switchCanCompleteNormally(statement: any): boolean {
  const cases: any[] = statement.cases ?? []
  // the switch block is empty
  if (cases.length === 0) return true
  // there is no default label
  const hasDefault = cases.some(switchCase =>
    (switchCase.labels as any[]).some(label => label.kind === 'DefaultLabel')
  )
  if (!hasDefault) return true
  // there are labels after the last group of statements
  const last = cases[cases.length - 1]
  if (!last.statements || last.statements.length === 0) return true
  // the last statement of the switch block can complete normally
  if ((last.statements as any[]).every(canCompleteNormally)) return true
  // a break leaves the switch
  return cases.some(switchCase => containsBreak(switchCase.statements))
}

/** Whether a `break` inside the node leaves the loop or switch that contains the node. */
function containsBreak(node: any): boolean {
  if (node === null || typeof node !== 'object') return false
  if (Array.isArray(node)) return node.some(containsBreak)
  switch (node.kind) {
    case 'BreakStatement':
      return true
    // a break inside another loop or switch leaves that one
    case 'WhileStatement':
    case 'DoStatement':
    case 'BasicForStatement':
    case 'SwitchStatement':
      return false
  }
  return Object.values(node).some(containsBreak)
}

/** Whether a `continue` inside the node continues the loop that contains the node. */
function containsContinue(node: any): boolean {
  if (node === null || typeof node !== 'object') return false
  if (Array.isArray(node)) return node.some(containsContinue)
  switch (node.kind) {
    case 'ContinueStatement':
      return true
    // a continue inside another loop continues that one
    case 'WhileStatement':
    case 'DoStatement':
    case 'BasicForStatement':
      return false
  }
  return Object.values(node).some(containsContinue)
}

import { JavaEvaluator } from '../JavaEvaluator'
import { IRunnerPlugin } from '../runner'

class MockConductor implements IRunnerPlugin {
  outputs: string[] = []
  results: string[] = []
  errors: string[] = []
  statuses: Array<{ s: string; a: boolean }> = []
  sendOutput(message: string): void {
    this.outputs.push(message)
  }
  sendResult(result: string): void {
    this.results.push(result)
  }
  sendError(error: string): void {
    this.errors.push(error)
  }
  updateStatus(status: any, isActive: boolean): void {
    this.statuses.push({ s: String(status), a: isActive })
  }
}

test('evaluateFile with unsupported file emits message', async () => {
  const mock = new MockConductor()
  const ev = new JavaEvaluator(mock)
  await ev.evaluateFile('hello.txt', 'console')
  expect(mock.outputs.length).toBeGreaterThan(0)
  expect(mock.outputs[0]).toMatch(/unsupported file type/)
  expect(mock.errors.length).toBe(0)
})

test('evaluateFile with .class base64 emits placeholder run message and result', async () => {
  const mock = new MockConductor()
  const ev = new JavaEvaluator(mock)
  // Use a minimal dummy classfile header (CAFEBABE) as base64; the evaluator
  // stub only inspects bytes and currently does not run them.
  const buf = Buffer.from([0xca, 0xfe, 0xba, 0xbe])
  const b64 = buf.toString('base64')
  await ev.evaluateFile('Main.class', b64)
  // JavaEvaluator currently emits a placeholder message then a result string
  expect(mock.outputs.some(o => /running class via in-memory runner is not yet implemented/.test(o))).toBe(true)
  // sendResult is called with an empty string in the stub
  expect(mock.results.length).toBeGreaterThanOrEqual(1)
})

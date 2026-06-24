import JavaEvaluator from '../JavaEvaluator'

class MockConductor {
  outputs: string[] = []
  results: string[] = []
  errors: string[] = []
  sendOutput(message: string): void {
    this.outputs.push(message)
  }
  sendResult(result: string): void {
    this.results.push(result)
  }
  sendError(error: string): void {
    this.errors.push(error)
  }
}

describe('JavaEvaluator', () => {
  test('reports unsupported file type for non-.class files', async () => {
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)

    await ev.evaluateFile('program.txt', 'ignored')

    expect(mock.outputs).toContain('JavaEvaluator: unsupported file type')
    expect(mock.results).toHaveLength(0)
    expect(mock.errors).toHaveLength(0)
  })

  test('falls back when class parsing fails and reports stub behaviour', async () => {
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)

    // pass some base64 that is not a valid classfile; parseBin should throw
    const invalidBytes = Buffer.from([0x00, 0x01, 0x02]).toString('base64')

    await ev.evaluateFile('Main.class', invalidBytes)

    expect(mock.outputs).toContain('JavaEvaluator: running class via in-memory runner is not yet implemented')
    expect(mock.results).toContain('')
    expect(mock.errors).toHaveLength(0)
  })
})

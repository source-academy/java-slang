export type RunnerStatus = 'IDLE' | 'RUNNING' | 'ERROR' | 'FINISHED'

export interface IRunnerPlugin {
  sendOutput(message: string): void
  sendResult(result: string): void
  sendError(error: string): void
  updateStatus(status: RunnerStatus, isActive: boolean): void
}

export abstract class BasicEvaluator {
  protected conductor: IRunnerPlugin
  constructor(conductor: IRunnerPlugin) {
    this.conductor = conductor
  }

  abstract evaluateChunk(chunk: string): Promise<void>

  async evaluateFile(fileName: string, fileContent: string): Promise<void> {
    // default: treat file content as a single chunk
    await this.evaluateChunk(fileContent)
  }
}

export function initialise(_evaluator: any) {
  // This is a minimal shim for initialise used in bundling entrypoints.
  // Real conductor runner initialisation is out of scope for this repo.
  return
}

export default BasicEvaluator

import { runECEvaluator } from '../..'
import { Result } from '../../types'

export type LibraryRun = { result: Result; out: string[]; err: string[] }

/** Runs a program through the public entry point, capturing stdout and stderr. */
export const run = async (code: string, targetStep?: number): Promise<LibraryRun> => {
  const out: string[] = []
  const err: string[] = []
  const result = await runECEvaluator(code, targetStep, {
    stdout: s => out.push(s),
    stderr: (type, msg) => err.push(`${type}: ${msg}`)
  })
  return { result, out, err }
}

/** Wraps statements in a `Main.main`, with optional extra top-level classes. */
export const program = (body: string, classes: string = '') => `
  ${classes}
  public class Main {
    public static void main(String[] args) {
      ${body}
    }
  }`

/** Every prefix run must print a prefix of the full run's output: the re-run stepping model. */
export const expectStableAcrossSteps = async (code: string) => {
  const full = await run(code)
  expect(full.result.status).toBe('finished')
  for (let step = 0; step <= full.result.context.totalSteps; step++) {
    const partial = await run(code, step)
    expect(partial.out).toEqual(full.out.slice(0, partial.out.length))
  }
  return full
}

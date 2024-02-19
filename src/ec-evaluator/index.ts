import { parse } from "../ast/parser";
import { Control, Environment, Stash } from "./components";
import { STEP_LIMIT } from "./constants";
import { evaluate } from "./interpreter";
import { Context, Error, Finished, Result } from "./types";

export const runECEvaluator = (
  files: Partial<Record<string, string>>,
  entrypointFilePath: string,
  context: Context,
  targetStep: number = STEP_LIMIT,
): Promise<Result> => {
  try {
    const code = files[entrypointFilePath];
    const compilationUnit = parse(code!);

    context.control.push(compilationUnit!);
    const value = evaluate(context, targetStep);

    return new Promise((resolve, _) => {
      resolve({ status: 'finished', context, value } as Finished);
    });
  } catch {
    return new Promise((resolve, _) => {
      resolve({ status: 'error' } as Error);
    });
  }
}

export const createContext = (): Context => ({
  errors: [],

  control: new Control(),
  stash: new Stash(),
  environment: new Environment(),

  totalSteps: STEP_LIMIT,
});

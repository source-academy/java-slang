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
    // parse() may throw SyntaxError.
    const compilationUnit = parse(code!);

    context.control.push(compilationUnit!);
    // evaluate() may throw RuntimeError
    const value = evaluate(context, targetStep);

    return new Promise((resolve, _) => {
      resolve({ status: 'finished', context, value } as Finished);
    });
  } catch (e) {
    context.errors.push(e);
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

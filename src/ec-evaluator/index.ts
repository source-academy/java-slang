import { parse } from "../ast/parser";
import { Control, Environment, Stash } from "./components";
import { STEP_LIMIT } from "./constants";
import { RuntimeError } from "./errors";
import { evaluate } from "./interpreter";
import { Context, Error, Finished, Result } from "./types";

export const runECEvaluator = (
  code: string,
  targetStep: number = STEP_LIMIT,
): Promise<Result> => {
  const context = createContext();
  try {
    // parse() may throw SyntaxError.
    const compilationUnit = parse(code!);

    context.control.push(compilationUnit!);
    // evaluate() may throw RuntimeError
    const value = evaluate(context, targetStep);

    return new Promise((resolve, _) => {
      resolve({ status: 'finished', context, value } as Finished);
    });
  } catch (e) {
    // Possible interpreting language error thrown, so conversion to RuntimeError may be required.
    const error = e.type ? e : new RuntimeError(e.message);
    context.errors.push(error);
    return new Promise((resolve, _) => {
      resolve({ status: 'error', context } as Error);
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

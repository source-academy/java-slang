import { Symbol } from "./types";

export const STEP_LIMIT = 100000;
export const DECLARED_BUT_NOT_YET_ASSIGNED = {
  kind: "Symbol",
  value: "Used to implement block scope"
} as Symbol;

import { coalesceResults, Result } from "../";
import {
  AbstractModularCompilationUnitCtx,
  AbstractOrdinaryCompilationUnitCtx,
  CompilationUnitCstNode,
  CompilationUnitCtx,
} from "java-parser";

const isAbstractOrdinaryCompilationUnitCtx = (
  ctx: CompilationUnitCtx
): ctx is AbstractOrdinaryCompilationUnitCtx =>
  "ordinaryCompilationUnit" in ctx;

const isAbstractModularCompilationUnitCtx = (
  ctx: CompilationUnitCtx
): ctx is AbstractModularCompilationUnitCtx => "modularCompilationUnit" in ctx;

export const checkCompilationUnit = (node: CompilationUnitCstNode): Result => {
  const { children } = node;
  if (isAbstractOrdinaryCompilationUnitCtx(children))
    return coalesceResults(children.ordinaryCompilationUnit);
  if (isAbstractModularCompilationUnitCtx(children))
    return coalesceResults(children.modularCompilationUnit);
  throw new Error("Compilation unit ctx cannot be recognized.");
};

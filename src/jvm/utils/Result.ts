export interface SuccessResult<T> {
  result: T;
}

export interface ErrorResult {
  exceptionCls: string;
  msg: string;
}

export interface DeferResult {
  isDefer: true;
}

export type Result<T> = SuccessResult<T> | ErrorResult | DeferResult;

export type ImmediateResult<T> = SuccessResult<T> | ErrorResult;

export function checkSuccess<T>(result: Result<T>): result is SuccessResult<T> {
  return (result as SuccessResult<T>).result !== undefined;
}

export function checkError<T>(result: Result<T>): result is ErrorResult {
  return (result as ErrorResult).exceptionCls !== undefined;
}

export function checkDefer<T>(result: Result<T>): result is DeferResult {
  return (result as DeferResult).isDefer !== undefined;
}

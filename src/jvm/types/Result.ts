export enum ResultType {
  SUCCESS,
  ERROR,
  DEFER
}

export interface SuccessResult<T> {
  status: ResultType.SUCCESS
  result: T
}

export interface ErrorResult {
  status: ResultType.ERROR
  exceptionCls: string
  msg: string
}

export interface DeferResult {
  status: ResultType.DEFER
}

export type Result<T> = SuccessResult<T> | ErrorResult | DeferResult

export type ImmediateResult<T> = SuccessResult<T> | ErrorResult

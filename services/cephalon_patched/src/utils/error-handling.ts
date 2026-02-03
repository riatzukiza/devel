export interface ErrorResult {
  success: false;
  error: string;
}

export interface SuccessResult<T> {
  success: true;
  data: T;
}

export type Result<T> = SuccessResult<T> | ErrorResult;

export function handleError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<Result<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: handleError(error) };
  }
}

export function tryCatchSync<T>(fn: () => T): Result<T> {
  try {
    const data = fn();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: handleError(error) };
  }
}

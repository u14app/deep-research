import type { APICallError } from "ai";
import { isObject, isString } from "radash";

interface GeminiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

export function parseError(err: unknown): string {
  let errorMessage: string = "Unknown Error";
  if (isString(err)) errorMessage = err;
  if (isObject(err)) {
    const { error } = err as { error: APICallError };
    if (error.responseBody) {
      const response = JSON.parse(error.responseBody) as GeminiError;
      errorMessage = `[${response.error.status}]: ${response.error.message}`;
    } else {
      errorMessage = `[${error.name}]: ${error.message}`;
    }
  }
  return errorMessage;
}

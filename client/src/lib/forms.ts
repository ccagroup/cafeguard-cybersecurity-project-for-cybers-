import { ApiError } from "./api";

export function serverFieldErrors(err: unknown): Record<string, string> {
  if (err instanceof ApiError && err.fields) {
    return Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k, v[0]]));
  }
  return {};
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong. Please try again.";
}

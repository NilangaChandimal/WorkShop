import { AxiosError } from "axios";
import type { ApiError } from "./types";

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response) {
    const data = error.response.data as ApiError;
    const status = error.response.status;

    // Validation errors — join all field messages
    if (status === 422 && data.errors) {
      return Object.values(data.errors).flat().join(" ");
    }

    if (data.message) return data.message;

    if (status === 403) return "You don't have permission to do that.";
    if (status === 404) return "The requested resource was not found.";
    if (status === 429) return "Too many requests. Please wait a moment.";
  }

  if (error instanceof Error) return error.message;

  return "Something went wrong. Please try again.";
}

export function getErrorCode(error: unknown): string | null {
  if (error instanceof AxiosError && error.response) {
    return (error.response.data as ApiError)?.error ?? null;
  }
  return null;
}

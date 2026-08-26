/**
 * Toast Error Handlers
 *
 * UI-specific error handling utilities that combine error parsing
 * with toast notifications using Sonner.
 *
 * These utilities wrap the pure error handling functions from @repo/utilities
 * and provide toast-specific implementations for the frontend.
 */

import { toast } from "sonner";
import {
  parseValidationErrors,
  getErrorStatus,
  getErrorMessage,
} from "@repo/utilities/errors/error-parsing";

/**
 * Shows appropriate error toast based on status code.
 * For 422 validation errors, shows each error as a separate toast.
 * For other errors, shows a single toast with the error message.
 *
 * @param error - The error object from API call
 * @param fallbackMessage - Message to show if no error message is found
 *
 * @example
 * try {
 *   await apiCall();
 * } catch (error) {
 *   handleErrorToast(error, 'Failed to update profile');
 *   throw error;
 * }
 */
export function handleErrorToast(
  error: unknown,
  fallbackMessage: string,
): void {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error, fallbackMessage);

  if (status === 422) {
    // Parse and show all validation errors in a single toast as a list
    const errors = parseValidationErrors(message);

    // Create a React element with proper line breaks
    const errorList = (
      <div className="space-y-1">
        {errors.map((err, index) => (
          <div key={index} className="flex gap-2">
            <span>•</span>
            <span>{err}</span>
          </div>
        ))}
      </div>
    );

    toast.error(errorList);
  } else if (status === 409) {
    // Conflict: the resource's state changed since it was loaded (e.g. someone
    // else already actioned it). The server message already explains what's
    // wrong; add a hint that the view is stale so the user understands why.
    toast.error(message, {
      description: "This item's status has changed — the list has been refreshed.",
    });
  } else {
    // Show single error message
    toast.error(message);
  }
}

export function handleErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string[] {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error, fallbackMessage);

  if (status === 422) {
    // Parse and show all validation errors in a single toast as a list
    const errors = parseValidationErrors(message);
    return errors;
  } else {
    // Show single error message
    return [message];
  }
}

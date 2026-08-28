/**
 * Error Handling Utilities
 * 
 * Centralized error handling utilities for parsing and displaying errors
 * across the application, particularly for API validation errors.
 */

/**
 * Parses validation errors from 422 responses.
 * 
 * Backend validation errors come in the format:
 * "headline: headline mustnt exceed 75 characters(-)jobTitle: job title must be a date"
 * 
 * This function:
 * 1. Splits the message by "(-)" separator
 * 2. Removes field name prefixes (text before first colon)
 * 3. Returns array of cleaned error messages
 * 
 * @param message - The error message string from the API
 * @returns Array of cleaned error messages without field names
 * 
 * @example
 * parseValidationErrors("headline: headline mustnt exceed 75 characters(-)jobTitle: job title must be a date")
 * // Returns: ["headline mustnt exceed 75 characters", "job title must be a date"]
 */
export function parseValidationErrors(message: string): string[] {
    const errors = message.split('(-)').map(err => {
        const colonIndex = err.indexOf(':');
        if (colonIndex !== -1) {
            return err.substring(colonIndex + 1).trim();
        }
        return err.trim();
    }).filter(Boolean);

    return errors.length > 0 ? errors : [message];
}

/**
 * Type guard to check if an error has HTTP status code properties.
 * 
 * @param error - The error object to check
 * @returns The HTTP status code if present, null otherwise
 * 
 * @example
 * try {
 *   await apiCall();
 * } catch (error) {
 *   const status = getErrorStatus(error);
 *   if (status === 422) {
 *     // Handle validation error
 *   }
 * }
 */
export function getErrorStatus(error: unknown): number | null {
    if (error && typeof error === 'object') {
        const err = error as { status?: number; statusCode?: number };
        return err.status ?? err.statusCode ?? null;
    }
    return null;
}

/**
 * Extracts error message from an error object.
 * 
 * @param error - The error object
 * @param fallback - Fallback message if no message is found
 * @returns The error message string
 */
export function getErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object') {
        const err = error as { message?: string };
        return err.message || fallback;
    }
    return fallback;
}

/**
 * Creates an Error with HTTP status code properties attached.
 *
 * Used by API service functions to throw errors that carry the HTTP status,
 * so catch sites (e.g. handleErrorToast) can branch on status code — for
 * example, formatting 422 validation errors differently from other failures.
 *
 * @param message - Error message, typically from the API response body
 * @param status - HTTP status code to attach
 *
 * @example
 * if (!response.ok) throw createApiError(data.message || 'Request failed', response.status);
 */
export function createApiError(message: string, status: number) {
    return Object.assign(new Error(message), { status, statusCode: status });
}

/**
 * Converts a ZodError into a plain Error with a readable message; every other
 * error is re-thrown unchanged. Used in the service layer's catch block so
 * callers only ever handle plain Errors (or API errors from createApiError),
 * never a ZodError shape.
 *
 * @example
 * try {
 *   const validated = schema.parse(payload);
 *   return await api.doSomething(validated);
 * } catch (error) {
 *   wrapZodError(error);
 * }
 */
export function wrapZodError(error: unknown): never {
    if (
        error &&
        typeof error === 'object' &&
        'issues' in error &&
        Array.isArray((error as { issues: unknown }).issues)
    ) {
        const issues = (error as { issues: { path: (string | number)[]; message: string }[] }).issues;
        const message = issues
            .map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
            .join(', ');
        throw new Error(message || 'Validation failed');
    }
    throw error;
}

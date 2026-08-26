/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import { logger } from "@/infrastructure/monitoring/logger";
import { IS_DEVELOPMENT, IS_DEV, IS_PRODUCTION } from "@/constants/variables";

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  type?: string;
  details?: unknown;
  code?: string;
  showDetails?: boolean;
}

export interface CustomError {
  type: string;
  message?: string;
  statusCode?: number;
  details?: unknown;
  customMessage?: string;
  code?: string;
  schemaDefinition?: any;
  showDetails?: boolean;
}

export const ERROR_TYPES = {
  VALIDATION: "validation",
  DATABASE: "database",
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  BAD_REQUEST: "bad_request",
  INTERNAL_SERVER_ERROR: "internal_server_error",
  CONFLICT: "conflict",
  SETUP_REQUIRED: "setup_required",
  TIMEOUT: "timeout",
  GEMINI_ERROR: "gemini_error",
  SERVER_ERROR: "server_error",
  EXTERNAL_API_ERROR: "external_api_error",
  RATE_LIMIT: "rate_limit",
};

export class AppError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly type?: string;
  public readonly details?: unknown;
  public readonly showDetails: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    type?: string,
    details?: unknown,
    showDetails: boolean = false,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.type = type;
    this.details = details;
    this.showDetails = showDetails;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper function to create specific error types
export const createError = {
  validation: (
    message: string,
    details?: unknown,
    showDetails: boolean = false,
  ) =>
    new AppError(
      message,
      422,
      true,
      ERROR_TYPES.VALIDATION,
      details,
      showDetails,
    ),
  unauthorized: (message: string = "Unauthorized", details?: unknown) =>
    new AppError(message, 401, true, ERROR_TYPES.UNAUTHORIZED, details),
  forbidden: (message: string = "Forbidden", details?: unknown) =>
    new AppError(message, 403, true, ERROR_TYPES.FORBIDDEN, details),
  notFound: (message: string = "Resource not found", details?: unknown) =>
    new AppError(message, 404, true, ERROR_TYPES.NOT_FOUND, details),
  badRequest: (message: string, details?: unknown) =>
    new AppError(message, 400, true, ERROR_TYPES.BAD_REQUEST, details),
  conflict: (message: string, details?: unknown) =>
    new AppError(message, 409, true, ERROR_TYPES.CONFLICT, details),
  database: (
    message: string = "Database service unavailable",
    details?: unknown,
  ) => new AppError(message, 503, true, ERROR_TYPES.DATABASE, details),
  externalApi: (
    message: string = "Upstream service error",
    details?: unknown,
  ) => new AppError(message, 502, true, ERROR_TYPES.EXTERNAL_API_ERROR, details),
  timeout: (message: string = "Request timeout", details?: unknown) =>
    new AppError(message, 408, true, ERROR_TYPES.TIMEOUT, details),
  rateLimit: (message: string = "Rate limit exceeded", details?: unknown) =>
    new AppError(message, 429, true, ERROR_TYPES.RATE_LIMIT, details),
  internal: (message: string = "Internal server error", details?: unknown) =>
    new AppError(
      message,
      500,
      false,
      ERROR_TYPES.INTERNAL_SERVER_ERROR,
      details,
    ),
};

/**
 * Check if an error is a system/database error that should be hidden from users
 */
function isSystemError(message: string): boolean {
  return (
    message.includes("getaddrinfo") ||
    message.includes("ECONNREFUSED") ||
    message.includes("password authentication failed") ||
    message.includes("FATAL") ||
    (message.includes("column") && message.includes("does not exist")) ||
    (message.includes("relation") && message.includes("does not exist")) ||
    (message.includes("table") && message.includes("does not exist")) ||
    message.includes("duplicate key value violates") ||
    message.includes("syntax error") ||
    message.includes("invalid input syntax") ||
    message.includes("EAI_AGAIN")
  );
}

/**
 * Error types that are safe to expose their message to users
 */
const SAFE_ERROR_TYPES = [
  ERROR_TYPES.VALIDATION,
  ERROR_TYPES.UNAUTHORIZED,
  ERROR_TYPES.FORBIDDEN,
  ERROR_TYPES.NOT_FOUND,
  ERROR_TYPES.BAD_REQUEST,
  ERROR_TYPES.CONFLICT,
  ERROR_TYPES.RATE_LIMIT,
  ERROR_TYPES.TIMEOUT,
];

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again later.";

/**
 * Global Express error handling middleware
 * Must be used as the last middleware in the app
 */
export function errorHandler(
  error: ApiError | CustomError | Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = GENERIC_ERROR_MESSAGE;
  let details = {};
  let errorType = ERROR_TYPES.INTERNAL_SERVER_ERROR;
  let rawErrorMessage = ""; // Store original error for logging
  let showDetails = false;

  // Store raw message for logging
  if (error instanceof Error) {
    rawErrorMessage = error.message;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    rawErrorMessage = (error as CustomError).message || "";
  }

  // Handle AppError instances
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorType = error.type || ERROR_TYPES.INTERNAL_SERVER_ERROR;
    // Only expose message for safe error types
    message = SAFE_ERROR_TYPES.includes(errorType)
      ? error.message
      : GENERIC_ERROR_MESSAGE;
    details = error.details || {};
    showDetails = error.showDetails;
  }
  // Handle custom error objects with type property (thrown from controllers)
  else if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    typeof (error as CustomError).type === "string"
  ) {
    const err = error as CustomError;
    errorType = err.type;
    showDetails = err.showDetails ?? false;

    switch (err.type) {
      case ERROR_TYPES.VALIDATION:
        statusCode = 422;
        message = err.message || "Validation error";
        details = err.details || { code: "VALIDATION_ERROR" };
        (req as any).__validationSchemaDefinition = err.schemaDefinition;
        break;
      case ERROR_TYPES.UNAUTHORIZED:
        statusCode = 401;
        message = err.message || "Unauthorized";
        details = err.details || {};
        break;
      case ERROR_TYPES.FORBIDDEN:
        statusCode = 403;
        message = err.message || "Forbidden";
        details = err.details || {};
        break;
      case ERROR_TYPES.BAD_REQUEST:
        statusCode = 400;
        message = err.message || "Bad request";
        details = err.details || {};
        break;
      case ERROR_TYPES.CONFLICT:
        statusCode = 409;
        message = err.message || "Conflict";
        details = err.details || {};
        break;
      case ERROR_TYPES.NOT_FOUND:
        statusCode = 404;
        message = err.message || "Not found";
        details = err.details || {};
        break;
      case ERROR_TYPES.TIMEOUT:
        statusCode = 408;
        message = err.message || "Request timeout";
        details = err.details || {};
        break;
      case ERROR_TYPES.RATE_LIMIT:
        statusCode = 429;
        message = err.message || "Rate limit exceeded";
        details = err.details || {};
        break;
      // System errors - always use generic message
      case ERROR_TYPES.DATABASE:
        statusCode = 503;
        message = GENERIC_ERROR_MESSAGE;
        details = { code: "DB_ERROR" };
        break;
      case ERROR_TYPES.GEMINI_ERROR:
        statusCode = 502;
        message = GENERIC_ERROR_MESSAGE;
        details = { code: "EXTERNAL_API_ERROR" };
        break;
      case ERROR_TYPES.EXTERNAL_API_ERROR:
        statusCode = 502;
        message = GENERIC_ERROR_MESSAGE;
        details = { code: "EXTERNAL_API_ERROR" };
        break;
      default:
        statusCode = err.statusCode ?? 500;
        message = GENERIC_ERROR_MESSAGE;
        details = {};
    }
  }
  // Handle standard Error instances (system errors)
  else if (error instanceof Error) {
    // All raw Errors are treated as system errors - never expose message
    message = GENERIC_ERROR_MESSAGE;

    // Detect specific error types for appropriate status code
    if (isSystemError(error.message)) {
      statusCode = 503;
      errorType = ERROR_TYPES.DATABASE;
      details = { code: "SYSTEM_ERROR" };
    }
  }

  // console.error("Error occurred:", {
  //   statusCode,
  //   message,
  //   details,
  //   rawMessage: rawErrorMessage,
  //   type: errorType,
  //   url: req.url,
  //   method: req.method,
  //   ip: req.ip,
  //   userAgent: req.get("User-Agent"),
  //   stack: error instanceof Error ? error.stack : undefined,
  // });

  // Log the error with the REAL message (for debugging)
  logger.error("Error occurred:", {
    statusCode,
    rawMessage: rawErrorMessage, // Always log actual error message
    type: errorType,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Prepare response - details only in development
  const errorResponse = {
    success: false,
    message,
    ...(!IS_PRODUCTION && { rawErrorMessage }),
    ...(Object.keys(details).length > 0 &&
      (IS_DEVELOPMENT || IS_DEV || showDetails) && { details }),
    ...(!IS_PRODUCTION ? { type: errorType } : {}),
  };

  res.status(statusCode).json(errorResponse);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: "error",
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`,
  });
}

/**
 * @deprecated Use the global error middleware instead
 * This function is kept for backward compatibility
 */
export function handleError(
  error: unknown,
  res: Response,
  endpoint?: string,
): Response {
  logger.warn(
    "Using deprecated handleError function. Use global error middleware instead.",
    { endpoint },
  );

  // Convert to our error format and use the main error handler logic
  let statusCode = 500;
  let message = "Internal server error";

  if (error instanceof Error) {
    message = error.message;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    message = (error as any).message || message;
    statusCode = (error as any).statusCode || statusCode;
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
}

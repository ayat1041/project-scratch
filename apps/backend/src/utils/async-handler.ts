import { Request, Response, NextFunction } from "express";

type AsyncController = (
  _req: Request,
  _res: Response,
  _next: NextFunction,
) => Promise<void | Response>;

/**
 * Wraps an asynchronous controller function to handle errors automatically.
 *
 * This utility function takes an async controller (`fn`) and returns a new function
 * that executes the controller and catches any rejected promises, passing errors to
 * Express's `next` error handler. This helps avoid repetitive try-catch blocks in
 * route handlers and ensures proper error propagation in middleware chains.
 *
 * @param fn - The asynchronous controller function to be wrapped. It should accept
 *   Express `Request`, `Response`, and `NextFunction` arguments.
 * @returns A function compatible with Express middleware that executes the controller
 *   and forwards any errors to the next middleware.
 */
export const asyncHandler = (fn: AsyncController) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

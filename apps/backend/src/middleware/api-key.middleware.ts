// middleware/apiKeyMiddleware.ts
import { createError } from "@/middleware/error.middleware";
import { Request, Response, NextFunction } from "express";

const API_KEY = process.env.API_KEY; // Store your API key in environment variables

export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      throw createError.unauthorized("Unauthorized", {
        error: "API key is required",
        hint: "Please provide a valid API key in the request headers.",
      });
    }

    if (apiKey !== API_KEY) {
      throw createError.forbidden("Forbidden", {
        error: "Invalid API key",
        hint: "Please provide a valid API key in the request headers.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

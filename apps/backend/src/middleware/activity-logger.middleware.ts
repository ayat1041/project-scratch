import { Request, Response, NextFunction } from "express";
import { getClientIp, getClientUserAgent } from "@/utils/activity-logger";

/**
 * Middleware to capture client information for activity logging
 * Adds IP address and user agent to res.locals for use in services
 */
export const captureClientInfo = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Extract and store client information
  res.locals.clientIp = getClientIp(req);
  res.locals.clientUserAgent = getClientUserAgent(req);

  next();
};

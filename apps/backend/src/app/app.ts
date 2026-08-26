import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import client from "prom-client";
import "module-alias/register";
import responseTime from "response-time";
import { logger } from "@/infrastructure/monitoring/logger";
import { registerRoutes } from "@/routes";
import bodyParser from "body-parser";
import {
  reqResTime,
  totalRequests,
} from "@/infrastructure/monitoring/prometheus-custom-metrics";
import { serverConfig } from "@/config/server";
import {
  buildHealthCheckFailureResponse,
  getHealthStatus,
  sanitizeHealthStatusForResponse,
} from "@/infrastructure/monitoring/health";
import { errorHandler, notFoundHandler } from "@/middleware/error.middleware";
import { registerSwaggerRoutes } from "@/app/swagger-routes";
import { globalRateLimiting } from "@/middleware/rate-limit.middleware";
import { RATELIMITING_VALUES } from "@/constants/rate-limiting-values";
import { IS_PRODUCTION } from "@/constants/variables";

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

export function createApp(): express.Application {
  const app = express();
  app.use(cors(serverConfig.cors));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: false, // Let nginx handle this
    }),
  );
  app.set("trust proxy", 1); // Trust first proxy
  app.disable("x-powered-by");
  // Body parsing middleware
  app.use(bodyParser.json({ limit: serverConfig.bodyParser.limit }));
  app.use(
    bodyParser.urlencoded({
      extended: true,
      limit: serverConfig.bodyParser.limit,
    }),
  );

  // Standard middleware
  app.use(cookieParser());

  // CORS configuration

  app.use(
    responseTime((req, res, time) => {
      totalRequests
        .labels({
          method: req.method,
          route: req.url,
          status_code: res.statusCode,
        })
        .inc(1);
      reqResTime
        .labels({
          method: req.method,
          route: req.url,
          status_code: res.statusCode,
        })
        .observe(time);
    }),
  );

  app.use(globalRateLimiting(RATELIMITING_VALUES.PUBLIC.GENERAL_API));

  // Restrict /metrics to internal/private network only — never expose to public internet.
  // Prometheus scrapes via Docker internal network (RFC 1918 ranges) or loopback.
  app.get("/metrics", async (req, res) => {
    const ip = req.ip ?? "";
    const isPrivate =
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("10.") ||
      ip.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(ip);

    if (!isPrivate) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    res.set("Content-Type", client.register.contentType);
    const metrics = await client.register.metrics();
    res.send(metrics);
  });

  // Health check endpoint
  app.get("/health", async (req, res) => {
    try {
      const healthStatus = await getHealthStatus();
      const statusCode =
        healthStatus.status === "UP"
          ? 200
          : healthStatus.status === "DEGRADED"
            ? 503
            : 503;
      res.status(statusCode).json(
        sanitizeHealthStatusForResponse(healthStatus, {
          includeDiagnostics: !IS_PRODUCTION,
        }),
      );
    } catch (error) {
      logger.error("Health check failed:", error);
      res.status(500).json(
        buildHealthCheckFailureResponse(error, {
          includeDiagnostics: !IS_PRODUCTION,
        }),
      );
    }
  });

  // Register all routes
  registerRoutes(app);

  // Register Swagger documentation routes
  registerSwaggerRoutes(app);

  // Default route
  app.get("/", (req, res) => {
    logger.info("Hello, from starter-api!");
    res.status(200).json({
      message: "Welcome to Starter API",
      health: "/health",
      version: "1.0.0",
      ...(!IS_PRODUCTION && { documentation: "/api-docs" }),
    });
  });

  // 404 handler - must be after all routes
  app.use(notFoundHandler);

  // Global error handler - must be last
  app.use(errorHandler);

  return app;
}

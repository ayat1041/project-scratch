import assert from "node:assert/strict";
import test from "node:test";

import express from "express";
import request from "supertest";

process.env.CSRF_SECRET ??= "test-csrf-secret-for-swagger-route-protection";
process.env.JWT_SECRET ??= "test-jwt-secret-for-swagger-route-protection";
process.env.NODE_ENV = "staging";

test("registerSwaggerRoutes does not expose swagger or debug routes in production-like environments", async () => {
  const { registerSwaggerRoutes } = await import("@/app/swagger-routes");
  const app = express();

  registerSwaggerRoutes(app);

  const swaggerJsonResponse = await request(app).get("/api-docs/swagger.json");
  const swaggerUiResponse = await request(app).get("/api-docs");
  const debugResponse = await request(app).get("/debug/auth-swagger");

  assert.equal(swaggerJsonResponse.status, 404);
  assert.equal(swaggerUiResponse.status, 404);
  assert.equal(debugResponse.status, 404);
});

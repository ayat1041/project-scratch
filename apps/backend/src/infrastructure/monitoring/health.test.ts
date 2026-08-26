import assert from "node:assert/strict";
import test, { before } from "node:test";

process.env.CSRF_SECRET ??= "test-csrf-secret-for-health-sanitization";
process.env.JWT_SECRET ??= "test-jwt-secret-for-health-sanitization";
process.env.NODE_ENV ??= "test";

type HealthStatus = import("@/infrastructure/monitoring/health").HealthStatus;
type HealthModule = typeof import("@/infrastructure/monitoring/health");

let buildHealthCheckFailureResponse: HealthModule["buildHealthCheckFailureResponse"];
let sanitizeHealthStatusForResponse: HealthModule["sanitizeHealthStatusForResponse"];

before(async () => {
  const healthModule = await import("@/infrastructure/monitoring/health");

  buildHealthCheckFailureResponse =
    healthModule.buildHealthCheckFailureResponse;
  sanitizeHealthStatusForResponse =
    healthModule.sanitizeHealthStatusForResponse;
});

const detailedHealthStatus: HealthStatus = {
  status: "DEGRADED",
  message: "Database is not connected",
  timestamp: "2026-05-31T00:00:00.000Z",
  services: {
    database: "DOWN",
    redis: "UP",
  },
  uptime: 123.45,
  details: {
    database: {
      connectionTime: 42,
      error: "password authentication failed for user",
    },
  },
};

test("sanitizeHealthStatusForResponse removes service diagnostics from public responses", () => {
  const response = sanitizeHealthStatusForResponse(detailedHealthStatus);

  assert.deepEqual(response, {
    status: "DEGRADED",
    message: "Service is unavailable",
    timestamp: "2026-05-31T00:00:00.000Z",
  });
});

test("sanitizeHealthStatusForResponse preserves diagnostics when explicitly requested", () => {
  const response = sanitizeHealthStatusForResponse(detailedHealthStatus, {
    includeDiagnostics: true,
  });

  assert.deepEqual(response, detailedHealthStatus);
});

test("buildHealthCheckFailureResponse hides raw errors unless diagnostics are requested", () => {
  const publicResponse = buildHealthCheckFailureResponse(
    new Error("postgresql://user:secret@db:5432/app"),
  );
  const diagnosticResponse = buildHealthCheckFailureResponse(
    new Error("postgresql://user:secret@db:5432/app"),
    { includeDiagnostics: true },
  );

  assert.equal(publicResponse.status, "DOWN");
  assert.equal(publicResponse.message, "Health check failed");
  assert.equal(publicResponse.error, undefined);
  assert.equal(
    diagnosticResponse.error,
    "postgresql://user:secret@db:5432/app",
  );
});

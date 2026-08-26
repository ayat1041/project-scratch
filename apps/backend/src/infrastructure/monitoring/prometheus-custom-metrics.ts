import client from "prom-client";
export const reqResTime = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [
    1, 50, 100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 10000, 20000,
    30000, 40000, 50000,
  ],
});
export const totalRequests = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});
export const activeRequests = new client.Gauge({
  name: "http_active_requests",
  help: "Number of active HTTP requests",
  labelNames: ["method", "route"],
});

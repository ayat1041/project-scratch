# Express.js Best Practices — Performance & Security

> Reference articles:
>
> - https://expressjs.com/en/advanced/best-practice-performance/
> - https://expressjs.com/en/advanced/best-practice-security/

This document maps every practice from both articles to how the backend implements it. Use it to understand the "why" behind architectural decisions and to verify that new code stays compliant.

---

## Part 1 — Performance

### 1. Use gzip compression

**Article says:** Compress response bodies to reduce payload size. For high-traffic sites, delegate this to the reverse proxy (nginx) rather than doing it in Node.

**How we comply:**  
Compression is intentionally **not** done in the Express app. The `helmet` setup has `hsts: false` with an explicit comment `// Let nginx handle this`, and no `compression` middleware is registered. nginx handles gzip for all traffic before it reaches Node, which is more efficient (C-level, off the JS thread). This is the article's recommended approach for production.

---

### 2. Don't use synchronous functions

**Article says:** Synchronous calls tie up the event loop. Avoid `fs.readFileSync`, `console.log/error` (synchronous to the terminal), and any other blocking calls in request handlers.

**How we comply:**

- All controllers are wrapped with `asyncHandler` ([src/utils/async-handler.ts](../src/utils/async-handler.ts)), so async errors automatically propagate to the error middleware without blocking.
- Runtime code should use the async-capable Winston logger instead of `console.*`.
- The one remaining use of synchronous file I/O (`writeFileSync` in `swagger-combined.ts`) runs only during the one-time build script, never inside a request handler.

**Known gap:** a small number of legacy request/worker paths still use `console.warn` or `console.error`. They should be converted to `logger.*` when those files are touched; new code must not add more `console.*` usage in runtime paths.

---

### 3. Do logging correctly

**Article says:** Use a proper logging library (e.g. Pino, Winston) instead of `console.log`. Console functions are synchronous and unsuitable for production.

**How we comply:**  
Winston with a **LokiTransport** is the application logging standard ([src/infrastructure/monitoring/logger.ts](../src/infrastructure/monitoring/logger.ts)).

| Destination         | Transport                      |
| ------------------- | ------------------------------ |
| Log aggregation     | LokiTransport → Grafana Loki   |
| Distributed tracing | OpenTelemetry → Grafana Tempo  |
| Metrics scraping    | Prometheus `/metrics` endpoint |

New middleware, controllers, services, and workers should log through `logger.*`, not `console.*`. Remaining legacy `console.*` calls are tracked as cleanup debt, not an accepted pattern.

---

### 4. Handle exceptions properly

**Article says:** Use `asyncHandler` / promises to catch async errors; pass them to `next(err)`. Do **not** use `uncaughtException` to continue running — the process state is corrupted after an uncaught exception.

**How we comply:**

**Async errors in controllers** — every controller is wrapped:

```ts
// src/utils/async-handler.ts
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

This ensures any rejected promise inside a controller is forwarded to the global error handler without a try-catch on every route.

**Global error handler** ([src/middleware/error.middleware.ts](../src/middleware/error.middleware.ts)) is registered as the last middleware. It classifies errors into `AppError` subtypes and returns safe, consistent JSON responses. Database/system error messages are never exposed to clients.

**`uncaughtException` / `unhandledRejection`** ([src/server.ts](../src/server.ts)) — following the article's explicit recommendation, these handlers **do not** attempt async cleanup (which is unsafe on a corrupted heap). They log via `logger` and call `process.exit(1)` immediately, letting Docker restart the container to a clean state:

```ts
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception — exiting immediately:", error);
  process.exit(1);
});
```

---

### 5. Set `NODE_ENV` to `"production"`

**Article says:** Setting `NODE_ENV=production` makes Express cache view templates, generate less verbose error messages, and can improve performance by ~3×.

**How we comply:**  
`NODE_ENV` is set in the Docker Compose files for each environment (`dev`, `staging`, `production`). The app reads it in several places:

```ts
// src/constants/variables.ts
export const IS_PRODUCTION =
  process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging";
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
```

Staging is intentionally treated as production-like for security-sensitive behavior. Any branch guarded by `IS_PRODUCTION` applies to both `NODE_ENV=production` and `NODE_ENV=staging`: no debug auth tokens/links, secure cookies, strict CSRF origin checks, hidden Swagger routes, and sanitized health/error responses.

The error handler exposes raw error messages only outside production-like environments and returns sanitized messages in production/staging.

---

### 6. Ensure your app automatically restarts

**Article says:** Use a process manager (PM2) or your OS init system so the app restarts if it crashes.

**How we comply:**  
Docker with `restart: unless-stopped` (docker-compose files) acts as the process manager. If the Node process exits with any code, Docker restarts the container. The graceful shutdown handler ([src/server.ts](../src/server.ts)) closes the HTTP server cleanly on `SIGTERM` / `SIGINT` with a 30-second force-exit backstop, ensuring zero-downtime rolling deploys.

---

### 7. Run your app in a cluster

**Article says:** Use Node's cluster module or PM2 cluster mode to use all CPU cores.

**How we comply:**  
The app itself runs as a single Node process per container. Horizontal scaling is achieved by running multiple Docker container replicas behind the nginx load balancer — effectively equivalent to clustering without shared-memory complexity. Background email delivery runs as its own process ([src/workers/email-send-consumer.ts](../src/workers/email-send-consumer.ts)), started from its own script/container, so it doesn't compete with the HTTP event loop.

---

### 8. Cache request results

**Article says:** Use a caching server (Redis, Varnish, nginx cache) to avoid repeating expensive operations.

**How we comply:**  
Redis is used for application-level caching:

| Runtime data          | TTL                    | Location                                  |
| --------------------- | ---------------------- | ----------------------------------------- |
| User permissions      | 10 s                   | Redis key `user:permissions:{userId}`     |
| Rate-limit counters   | Configurable per route | Redis keys under `rate-limit:*`           |
| Rapid abuse bans      | 1 hour                 | Redis key `rate-limit:banned:{hashedIp}`  |
| Session token records | 30 days                | PostgreSQL table `app_user_refresh_tokens` |

The Redis client ([src/infrastructure/cache/redis-client.ts](../src/infrastructure/cache/redis-client.ts)) connects with lazy connect, 10 s connection timeout, and graceful fallback logging so a Redis outage degrades gracefully rather than crashing the API.

---

### 9. Use a load balancer

**Article says:** Distribute traffic across multiple instances with nginx or HAProxy.

**How we comply:**  
nginx sits in front of all app containers in every environment. The Express app sets `app.set("trust proxy", 1)` so that `req.ip` correctly reflects the real client IP from `X-Forwarded-For` rather than the nginx proxy IP. The HTTP server also sets:

```ts
server.keepAliveTimeout = 65000; // slightly above nginx's 60 s default
server.headersTimeout = 66000;
```

This prevents the notorious 502 race condition where nginx reuses a keep-alive connection that Node has already closed.

---

### 10. Use a reverse proxy

**Article says:** Run Express behind nginx or HAProxy to handle TLS, compression, caching, and static files.

**How we comply:**  
nginx handles: TLS termination, gzip compression, HSTS headers, and static asset serving. This is why the app has `hsts: false` in its Helmet config and no `compression` middleware — those concerns belong to the proxy layer. The app only handles application logic.

---

---

## Part 2 — Security

### 1. Don't use deprecated versions of Express

**Article says:** Express 2.x / 3.x are unmaintained. Stay on Express 4 or 5.

**How we comply:**  
`package.json` uses `express: ^5.x` (check `pnpm-lock.yaml` for the pinned version). Run `pnpm audit` periodically; a CI step should enforce this.

---

### 2. Use TLS

**Article says:** Encrypt all traffic with TLS; let nginx handle termination.

**How we comply:**  
TLS is terminated at nginx. All production origins in the CORS allowlist are `https://` only. `HSTS` (`Strict-Transport-Security`) is set by nginx, not Express (matching the article's recommendation). Internal Docker-to-Docker traffic stays on a private network and does not require TLS.

---

### 3. Do not trust user input — Prevent open redirects

**Article says:** Validate any URL received as user input before calling `res.redirect`. An unvalidated redirect can send users to phishing sites.

**How we comply:**  
Both OAuth callback controllers (Google, LinkedIn) previously used `req.query.redirectTo` directly. This was fixed to enforce three rules:

```ts
const rawRedirect = req.query.redirectTo;
const redirectPath =
  typeof rawRedirect === "string" && // reject arrays / objects
  rawRedirect.startsWith("/") && // must be a relative path
  !rawRedirect.startsWith("//") // reject protocol-relative URLs e.g. //evil.com
    ? rawRedirect
    : "/"; // safe default

res.redirect(`${FRONTEND_URL}${redirectPath}`);
```

This ensures the final redirect URL always stays on the known `FRONTEND_URL` host.

---

### 4. Use Helmet

**Article says:** Use the `helmet` middleware to set security-relevant HTTP response headers.

**How we comply:**  
Helmet is applied as the second middleware in the stack ([src/app/app.ts](../src/app/app.ts)):

```ts
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
    hsts: false, // delegated to nginx
  }),
);
```

Headers set by Helmet on every response:

| Header                            | Effect                                 |
| --------------------------------- | -------------------------------------- |
| `Content-Security-Policy`         | Restricts script/style/image sources   |
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing            |
| `X-Frame-Options: SAMEORIGIN`     | Blocks clickjacking                    |
| `Cross-Origin-Resource-Policy`    | Prevents cross-origin resource loading |
| `Referrer-Policy`                 | Controls Referer leakage               |
| `X-DNS-Prefetch-Control`          | Disables DNS prefetch                  |

---

### 5. Reduce fingerprinting

**Article says:** Disable the `X-Powered-By` header so attackers can't trivially identify the server as Express.

**How we comply:**

```ts
app.disable("x-powered-by"); // src/app/app.ts
```

Additionally, the 404 and error responses return structured JSON via custom handlers ([src/middleware/error.middleware.ts](../src/middleware/error.middleware.ts)) — not Express's default HTML error pages, which are a fingerprinting vector.

---

### 6. Use cookies securely

**Article says:** Don't use the default session cookie name. Set `secure`, `httpOnly`, `sameSite`, and `domain` cookie options.

**How we comply:**

**Custom cookie names** — no default cookie names are used:

| Cookie        | Name (env-configurable)                         |
| ------------- | ----------------------------------------------- |
| Session token | `SESSION_TOKEN_NAME` (default: `session_token`) |
| CSRF token    | `csrf_token`                                    |

**Session cookie options** ([src/lib/session-auth.utils.ts](../src/lib/session-auth.utils.ts)):

```ts
{
  httpOnly: true,           // not readable by JS — protects against XSS token theft
  secure:   !IS_DEVELOPMENT, // HTTPS-only outside local development
  sameSite: IS_DEVELOPMENT ? "lax" : "none",
  maxAge:   SESSION_COOKIE_MAX_AGE, // 30 days
  domain:   IS_DEVELOPMENT ? undefined : COMMON_BASE,
  path:     "/",
}
```

`sameSite: "none"` is required outside local development because the frontend and API can live on separate trusted subdomains. That makes CSRF protection mandatory on cookie-authenticated mutations.

**CSRF cookie** is `httpOnly: false` by design — the double-submit pattern requires the frontend JS to read the token and send it as the `x-csrf-token` header. It is still signed, expires after 24 hours, uses `secure: true` outside local development, and uses `sameSite: "strict"` outside local development.

**CSRF request validation** ([src/middleware/csrf.middleware.ts](../src/middleware/csrf.middleware.ts), [src/lib/csrf.utils.ts](../src/lib/csrf.utils.ts)):

- Unsafe methods validate `Origin`, falling back to `Referer`.
- Present untrusted origins are rejected in every environment.
- Production-like environments require a trusted origin for unsafe requests.
- The header token and cookie token must both exist and match.
- The CSRF token signature, expiry, and optional user binding are verified.
- After successful unsafe validation, the CSRF cookie is rotated by default.

Use `ensureCsrfToken()` only to issue or refresh a token on safe bootstrap routes such as `GET /api/auth/v1/session-info`. Use `csrfProtection()` on state-changing routes.

---

### 7. Prevent brute-force attacks against authorization

**Article says:** Block authorization attempts using two metrics: consecutive failed attempts by username+IP, and total failed attempts from an IP over a long period.

**How we comply:**  
Three independent rate-limiting layers are applied via Redis with in-memory fallback ([src/middleware/rate-limit.middleware.ts](../src/middleware/rate-limit.middleware.ts)):

| Layer                 | Key material                                     | Scope                                               |
| --------------------- | ------------------------------------------------ | --------------------------------------------------- |
| Global per-IP limiter | hashed route-independent client IP               | Every request after common app middleware           |
| Route limiter         | hashed route scope + hashed IP + hashed identity | Auth/sensitive endpoints                            |
| Rapid abuse detector  | hashed client IP in a 10 second sliding window   | All requests; temporary ban after suspicious volume |

The limiter does not trust raw `X-Forwarded-For`; it relies on Express `req.ip` with `app.set("trust proxy", 1)`. Email, user id, route scope, and IP values are hashed before they are used in Redis keys.

Global abuse control:

- General API limit: 100 requests per minute outside local development.
- Rapid request alerts at 100, 250, and 500 requests in 10 seconds.
- Temporary one-hour ban after more than 500 requests in 10 seconds.
- Local `NODE_ENV=development` gets relaxed limits for manual testing; staging does not.

Password comparison uses a constant-time dummy hash even when the user doesn't exist, preventing timing attacks that reveal account existence:

```ts
const passwordHash = userInfo?.isVerified
  ? userInfo.password
  : DUMMY_PASSWORD_HASH;
const passwordMatch = await compare(password, passwordHash); // always runs
```

Auth endpoint response hardening also prevents simple account enumeration:

- Sign-in returns the same `400` message for missing user, unverified user, and wrong password.
- Forgot-password always returns the same `200` response whether or not an account exists.
- Signup availability checks return only `data.isUnique`; they do not expose ids, provider, verification state, role, or recovery hints.
- Signup submit returns a neutral public response for duplicate/conflict cases.
- Verification/reset links and session debug tokens are omitted from all production-like responses.

---

### 8. Ensure your dependencies are secure

**Article says:** Run `npm audit` regularly. Use Snyk or similar tools. Keep dependencies updated.

**How we comply:**

- `pnpm audit` should be run as part of CI (add it to the pipeline if not present).
- Key security dependencies are maintained and up to date: `helmet ^8`, `jose ^5`, `bcryptjs ^2`, `arctic ^3`, `ioredis ^5`.
- `CSRF_SECRET` is now required to be a **dedicated** environment variable — the previous fallback to `JWT_SECRET` (secret reuse) was eliminated. If `CSRF_SECRET` is missing at startup, the server throws immediately:

```ts
if (!process.env.CSRF_SECRET) {
  throw new Error(
    "Missing required environment variable: CSRF_SECRET. " +
      "Set a dedicated secret distinct from JWT_SECRET.",
  );
}
```

This ensures two independent secrets protect two independent security layers (session integrity vs. CSRF protection).

---

### 9. Additional considerations (OWASP Top 10)

| Threat                        | Mitigation in this codebase                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **SQL Injection**             | Drizzle ORM parameterized queries — no raw SQL string interpolation                                                            |
| **XSS**                       | Helmet CSP; `httpOnly` session cookie; DOMPurify used in email templates                                                       |
| **CSRF**                      | Trusted `Origin`/`Referer` validation, double-submit cookie pattern, HMAC-SHA256 signatures, `timingSafeEqual`, token rotation |
| **Broken Authentication**     | JWT `jti` + `familyId` chain; sliding-window rotation; replay attack detection revokes entire token family                     |
| **Sensitive data exposure**   | Error handler strips DB/system errors; `/health` is sanitized in production-like envs; `/metrics` restricted to private IPs    |
| **Security misconfiguration** | `x-powered-by` disabled; custom error pages; Helmet headers; env validation; Swagger disabled in production-like environments  |
| **Insecure dependencies**     | `pnpm audit`; pinned lockfile                                                                                                  |
| **OAuth security**            | PKCE/state validation; verified email enforcement; token email matching; safe relative redirects; global error middleware      |

---

### 10. Protect public operational surfaces

**Article theme:** Minimize exposed attack surface and avoid leaking operational details.

**How we comply:**

| Surface             | Production-like behavior                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| Swagger UI / JSON   | `registerSwaggerRoutes()` returns without registering `/api-docs/*` when `IS_PRODUCTION` is true.             |
| Swagger debug route | `/debug/auth-swagger` is not registered in production/staging because all Swagger routes are skipped.         |
| Root route          | Does not advertise API documentation outside local/non-production environments.                               |
| Health endpoint     | Returns only `status`, generic `message`, and `timestamp` in production/staging.                              |
| Health internals    | DB connection time, DB error text, Redis status, worker status, and uptime remain available only in non-prod. |
| Metrics endpoint    | `/metrics` is restricted to loopback and RFC 1918 private network ranges.                                     |

Detailed health checks still run internally so the process can set the right HTTP status (`200` for healthy, `503` for degraded/down), but public responses do not disclose database errors, worker names, Redis state, or uptime.

---

### 11. Standardize private route security order

**Article theme:** Make authorization behavior predictable and auditable.

**How we comply:**

The canonical protected route order is:

```txt
isAuthenticated -> csrfProtection -> hasPermission -> resolveResources -> authorize -> controller
```

Read-only routes skip CSRF validation because safe methods do not mutate state. Cookie-authenticated mutation routes must include CSRF validation.

The helper file [src/middleware/private-route-security.middleware.ts](../src/middleware/private-route-security.middleware.ts) defines `privateReadRoute()` and `privateMutationRoute()` wrappers that emit auditable middleware steps:

- `auth`
- `csrf`
- `permission`
- `resource`
- `authorization`

The wrappers are available for new and refactored routes. Older route files may still spell the middleware chain manually, but they should converge on the helper pattern when touched.

---

### 12. Regression tests for security behavior

**How we comply:**

| Test file                                                                                                                                                                   | Coverage                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [src/middleware/private-route-security.middleware.test.ts](../src/middleware/private-route-security.middleware.test.ts)                                                     | Private route helper ordering and required security steps.                                                   |
| [src/middleware/private-route-security.integration.test.ts](../src/middleware/private-route-security.integration.test.ts)                                                   | Auth, CSRF, permission, resource resolution, and authorization behavior on real routes.                      |
| [src/middleware/csrf.middleware.test.ts](../src/middleware/csrf.middleware.test.ts)                                                                                         | Origin/Referer validation and CSRF token rotation.                                                           |
| [src/modules/auth/v1/tests/integration/auth-security-regression.integration.test.ts](../src/modules/auth/v1/tests/integration/auth-security-regression.integration.test.ts) | Enumeration neutrality, CSRF sign-out, reset session revocation, session replay, and verification atomicity. |
| [src/app/swagger-routes.test.ts](../src/app/swagger-routes.test.ts)                                                                                                         | Swagger/debug docs are not exposed in production-like environments.                                          |
| [src/infrastructure/monitoring/health.test.ts](../src/infrastructure/monitoring/health.test.ts)                                                                             | Public health responses are sanitized unless diagnostics are explicitly requested.                           |

---

## Quick Compliance Checklist

Use this when reviewing a PR:

- [ ] New controllers wrapped with `asyncHandler`
- [ ] No new runtime `console.log/warn/error` — use `logger.*`
- [ ] No raw SQL string interpolation — use Drizzle ORM
- [ ] Any `res.redirect` with user-supplied URLs validates path format
- [ ] New cookies set `httpOnly`, `secure`, `sameSite`
- [ ] New env variables added to `.env.example`
- [ ] Rate limiting applied to new auth/sensitive routes
- [ ] No new secrets share the same value as `JWT_SECRET`
- [ ] Production-like responses do not include debug tokens, verification links, reset links, raw errors, or operational internals
- [ ] Cookie-authenticated mutation routes include `csrfProtection()`
- [ ] CSRF-protected frontend flows read the CSRF cookie fresh before unsafe requests
- [ ] Signup/account availability endpoints return only constrained boolean availability
- [ ] New private routes follow `isAuthenticated -> csrfProtection for mutations -> hasPermission -> resolveResources -> authorize -> controller`
- [ ] New Swagger routes/debug docs are not exposed when `IS_PRODUCTION` is true
- [ ] Health/readiness endpoints do not expose DB errors, worker details, Redis status, or uptime publicly in production/staging
- [ ] Security-sensitive behavior has focused regression tests when the contract changes

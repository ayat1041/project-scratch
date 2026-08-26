> **Status:** Draft
> **Version:** 1.0.0
> **Author:** <team-or-author>
> **Last updated:** 2026-05-29
> **Module:** `middleware/rate-limit.middleware.ts`

## Overview / Purpose

Rate limiting protects the backend from brute-force authentication attempts, high-volume scraping, and request floods. The application uses a Redis-backed middleware layer with process-local in-memory fallback, global per-IP throttling for all requests, and route-specific throttling for security-sensitive endpoints such as sign-in, sign-up, forgot-password, sign-out, role management, and permission management.

## States / Modes

| State / Mode             | Value / Code Path                                                        | Description                                                                                            |
| ------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Local development config | `IS_DEVELOPMENT === true`                                                | `RATELIMITING_VALUES` returns relaxed limits: `time=1`, `maxRequests=999999`.                          |
| Deployed config          | `IS_DEVELOPMENT === false`                                               | Public `dev`, `staging`, and `production` use the configured production-like rate limits.              |
| Global limiter           | `globalRateLimiting(RATELIMITING_VALUES.PUBLIC.GENERAL_API)`             | Mounted in `createApp()` before `/metrics`, `/health`, API routes, Swagger routes, and `/`.            |
| Route limiter            | `rateLimitingOnIndividualUserAndIp(...)`                                 | Mounted on sensitive route handlers; scopes counters by route, client IP, and request/user identity.   |
| IP-only limiter          | `rateLimitingOnIndividualIp(...)`                                        | Exported helper for future route use; scopes counters by client IP only.                               |
| Redis counter mode       | `redisClient.isRedisConnected() === true`                                | Counters and ban records are shared across API instances through Redis.                                |
| Memory fallback mode     | `redisClient.isRedisConnected() === false` or `increment(...) <= 0`      | Counters and bans are kept in process memory only; useful as a bounded safety net during Redis outage. |
| Active temporary ban     | `rate-limit:banned:{ipHash}` exists in Redis or `memoryBans` has the key | The request is rejected before normal global counting.                                                 |
| Within quota             | `requests <= maxRequests`                                                | Middleware calls `next()` and request processing continues.                                            |
| Over quota               | `requests > maxRequests`                                                 | Middleware throws `ERROR_TYPES.RATE_LIMIT`; global error middleware returns HTTP `429`.                |

> **Note:** The middleware does not read raw `X-Forwarded-For` headers. With `app.set("trust proxy", 1)`, Express resolves `req.ip` from the trusted first proxy.

## State Transition Diagram

```text
Incoming request
   |
   v
Express resolves req.ip
   |
   v
globalRateLimiting()
   |
   +-- active ban found
   |     v
   |   429 RATE_LIMIT + Retry-After
   |
   +-- rapid window count > 500 requests / 10 seconds
   |     v
   |   write 1-hour temporary ban
   |     v
   |   429 RATE_LIMIT + Retry-After
   |
   +-- global count > configured maxRequests
   |     v
   |   429 RATE_LIMIT + Retry-After
   |
   +-- within global quota
         v
      route handler chain
         |
         +-- route-specific limiter mounted
         |     |
         |     +-- route count > configured maxRequests
         |     |     v
         |     |   429 RATE_LIMIT + Retry-After
         |     |
         |     +-- within route quota
         |           v
         |        controller
         |
         +-- no route-specific limiter
               v
            controller
```

## Transitions Reference

### `incoming_request` -> `global_counted`

| Field        | Value                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Endpoint     | All requests handled after `app.use(globalRateLimiting(...))` in `createApp()`                                                             |
| Actor        | Any client                                                                                                                                 |
| Guard        | No active temporary ban for the resolved client IP.                                                                                        |
| Effect       | Increments `rate-limit:rapid:{ipHash}` in a `10` second window, then increments `rate-limit:global:{ipHash}` in the configured API window. |
| Side-effects | May log warning at rapid thresholds `100`, `250`, and `500`.                                                                               |

### `global_counted` -> `global_allowed`

| Field        | Value                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| Endpoint     | All globally limited requests                                                                               |
| Actor        | Any client                                                                                                  |
| Guard        | `rapidCount <= 500` and `requests <= RATELIMITING_VALUES.PUBLIC.GENERAL_API.maxRequests`.                   |
| Effect       | Calls `next()` so the request reaches `/metrics`, `/health`, API routes, Swagger routes, or `/`.            |
| Side-effects | Redis TTL is set on first count; memory fallback stores `expiresAt` in `memoryCounters` when Redis is down. |

### `global_counted` -> `global_rate_limited`

| Field        | Value                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Endpoint     | All globally limited requests                                            |
| Actor        | Any client                                                               |
| Guard        | `requests > RATELIMITING_VALUES.PUBLIC.GENERAL_API.maxRequests`.         |
| Effect       | Sets `Retry-After` to remaining TTL and throws `ERROR_TYPES.RATE_LIMIT`. |
| Side-effects | Logs `Rate limit exceeded for IP ...` through the app logger.            |

### `global_counted` -> `temporary_banned`

| Field        | Value                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| Endpoint     | All globally limited requests                                                                            |
| Actor        | Any client                                                                                               |
| Guard        | `rapidCount > 500` within `10` seconds.                                                                  |
| Effect       | Creates a `1` hour temporary ban using `rate-limit:banned:{ipHash}` and throws `ERROR_TYPES.RATE_LIMIT`. |
| Side-effects | Sets `Retry-After=3600`; writes to Redis when available and always writes to `memoryBans`.               |

### `temporary_banned` -> `global_rate_limited`

| Field        | Value                                                                                   |
| ------------ | --------------------------------------------------------------------------------------- |
| Endpoint     | All globally limited requests                                                           |
| Actor        | Client whose IP hash is currently banned                                                |
| Guard        | `getBanTtl(...)` returns a positive TTL from Redis or `memoryBans`.                     |
| Effect       | Rejects request before rapid/global counter increments.                                 |
| Side-effects | Sets `Retry-After` to the ban TTL and returns HTTP `429` through global error handling. |

### `global_allowed` -> `route_counted`

| Field        | Value                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Endpoint     | Routes that mount `rateLimitingOnIndividualUserAndIp(...)` or `rateLimitingOnIndividualIp(...)`.                                           |
| Actor        | Public user or authenticated user depending on route.                                                                                      |
| Guard        | Global limiter has already allowed the request.                                                                                            |
| Effect       | Builds a route key and increments the route-specific counter.                                                                              |
| Side-effects | Route key includes the HTTP method, Express base URL, route path, client IP hash, and either email hash, user hash, or anonymous identity. |

### `route_counted` -> `route_allowed`

| Field        | Value                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------- |
| Endpoint     | Routes with route-specific limiter middleware                                                |
| Actor        | Public user or authenticated user depending on route                                         |
| Guard        | `requests <= maxRequests` for that route-specific config.                                    |
| Effect       | Calls `next()` so later middleware and the controller can run.                               |
| Side-effects | Redis TTL is set on first count; memory fallback stores an expiry when Redis is unavailable. |

### `route_counted` -> `route_rate_limited`

| Field        | Value                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Endpoint     | Routes with route-specific limiter middleware                            |
| Actor        | Public user or authenticated user depending on route                     |
| Guard        | `requests > maxRequests` for that route-specific config.                 |
| Effect       | Sets `Retry-After` to remaining TTL and throws `ERROR_TYPES.RATE_LIMIT`. |
| Side-effects | Request does not reach later middleware or the controller.               |

### `redis_counter_mode` -> `memory_fallback_mode`

| Field        | Value                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Endpoint     | Any route using rate-limit middleware                                                            |
| Actor        | System runtime                                                                                   |
| Guard        | `redisClient.isRedisConnected() === false` or `redisClient.increment(...)` returns `0` or lower. |
| Effect       | Uses `memoryCounters` for counters and `memoryBans` for bans.                                    |
| Side-effects | Protection becomes process-local; separate API instances do not share fallback counters.         |

## DB Schema

No PostgreSQL tables are used for rate limiting. Runtime state is stored in Redis when connected, with a bounded in-memory fallback inside the Node.js process.

| Store  | Key / Field Shape                                        | Type / TTL                       | Nullable | Purpose                                                                          |
| ------ | -------------------------------------------------------- | -------------------------------- | -------- | -------------------------------------------------------------------------------- |
| Redis  | `rate-limit:global:{ipHash}`                             | integer counter, TTL from config | No       | Global request count for one client IP.                                          |
| Redis  | `rate-limit:rapid:{ipHash}`                              | integer counter, `10` second TTL | No       | Rapid request counter used for temporary ban detection.                          |
| Redis  | `rate-limit:banned:{ipHash}`                             | string value, `3600` second TTL  | No       | Temporary ban marker after excessive rapid requests.                             |
| Redis  | `rate-limit:route:{routeHash}:ip:{ipHash}:{identityKey}` | integer counter, TTL from config | No       | Route-specific counter scoped by route, IP, and request/user/anonymous identity. |
| Memory | `memoryCounters[key].requests`                           | number                           | No       | Process-local count when Redis is unavailable.                                   |
| Memory | `memoryCounters[key].expiresAt`                          | epoch milliseconds               | No       | Process-local expiry timestamp for a counter.                                    |
| Memory | `memoryBans[key]`                                        | epoch milliseconds               | No       | Process-local temporary ban expiry timestamp.                                    |

## Configuration Reference

| Config Path               | Production-like Value  | Local Development Value | Mounted / Used By                                     |
| ------------------------- | ---------------------- | ----------------------- | ----------------------------------------------------- |
| `PUBLIC.GENERAL_API`      | `100` requests / `60`s | `999999` / `1`s         | `createApp()` global middleware                       |
| `PUBLIC.HEALTH_CHECK`     | `50` requests / `10`s  | `999999` / `1`s         | Defined but not currently mounted separately          |
| `AUTH.SIGNUP`             | `3` requests / `600`s  | `999999` / `1`s         | Auth sign-up, uniqueness, verification, resend routes |
| `AUTH.SIGNIN`             | `5` requests / `60`s   | `999999` / `1`s         | Auth sign-in route                                    |
| `AUTH.FORGOT_PASSWORD`    | `3` requests / `600`s  | `999999` / `1`s         | Forgot/reset password routes                          |
| `AUTH.SIGNOUT`            | `10` requests / `60`s  | `999999` / `1`s         | Auth sign-out route                                   |
| `ADMIN.CREATE_ROLE`       | `10` requests / `60`s  | `999999` / `1`s         | Role create route                                     |
| `ADMIN.UPDATE_ROLE`       | `20` requests / `60`s  | `999999` / `1`s         | Role update route                                     |
| `ADMIN.DELETE_ROLE`       | `5` requests / `300`s  | `999999` / `1`s         | Role delete route                                     |
| `ADMIN.CREATE_PERMISSION` | `10` requests / `60`s  | `999999` / `1`s         | Permission create route                               |
| `ADMIN.UPDATE_PERMISSION` | `20` requests / `60`s  | `999999` / `1`s         | Permission update route                               |

## Nginx Level Rate Limiting

Nginx should act as the origin-side enforcement layer in front of the Node.js application. It is required for an enterprise-grade setup because it can reject abusive traffic before the request reaches Express body parsing, controller code, Redis, or the database. This layer also protects the API when Cloudflare is bypassed, disabled, misconfigured, or when traffic comes from trusted internal networks that do not pass through Cloudflare.

| Requirement                              | Implementation Guidance                                                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Trust only real upstream proxies         | Configure `set_real_ip_from` only for Cloudflare IP ranges or the private load balancer subnet; never trust arbitrary public `X-Forwarded-For` headers.            |
| Preserve client IP for limit keys        | Use `real_ip_header CF-Connecting-IP` for Cloudflare-fronted traffic, or `real_ip_header X-Forwarded-For` only when the sender is a trusted private proxy.         |
| Add broad API request limiting           | Apply a general `/api/` `limit_req` zone that is looser than the application limiter and absorbs floods before Node.js.                                            |
| Add stricter auth endpoint limiting      | Apply stricter zones to `/api/auth/v1/sign-in`, `/api/auth/v1/sign-up`, `/api/auth/v1/forgot-password`, `/api/auth/v1/reset-password`, and verification endpoints. |
| Add connection limiting                  | Use `limit_conn_zone` and `limit_conn` to prevent one IP from holding too many concurrent origin connections.                                                      |
| Return standard status                   | Set `limit_req_status 429` so clients and monitoring systems see the same status class as the Express limiter.                                                     |
| Keep Nginx less identity-aware than Node | Nginx should use IP/path based controls; Express remains responsible for email/name/user-aware counters.                                                           |
| Log and alert                            | Log limit events at `warn` level and export Nginx metrics/logs to the same observability pipeline used for app-level `429` responses.                              |

Suggested starting point:

```nginx
http {
    # Only trust Cloudflare and private load balancer networks here.
    # Keep this list current from Cloudflare published IP ranges.
    set_real_ip_from 203.0.113.0/24;
    set_real_ip_from 10.0.0.0/8;
    real_ip_header CF-Connecting-IP;
    real_ip_recursive on;

    limit_req_zone $binary_remote_addr zone=api_global:20m rate=20r/s;
    limit_req_zone $binary_remote_addr zone=auth_sensitive:20m rate=2r/s;
    limit_conn_zone $binary_remote_addr zone=conn_per_ip:20m;

    server {
        limit_req_status 429;
        limit_req_log_level warn;

        location /api/ {
            limit_req zone=api_global burst=40 nodelay;
            limit_conn conn_per_ip 30;
            proxy_pass http://starter_backend;
        }

        location ~ ^/api/auth/v1/(sign-in|sign-up|forgot-password|reset-password|verify-email|resend-email-verification-link)$ {
            limit_req zone=auth_sensitive burst=5 nodelay;
            proxy_pass http://starter_backend;
        }
    }
}
```

> **Important:** The sample values are starting points, not final production numbers. Tune them using real traffic percentiles, peak sign-in volume, load tests, and observed false-positive rates.

## Cloudflare Level Rate Limiting

Cloudflare should act as the public edge enforcement layer. It is required for an enterprise-grade setup because it can stop high-volume abusive traffic before it reaches Nginx, the origin network, Redis, or the database. Cloudflare also provides WAF signals, bot signals, ASN/country context, fingerprint fields on supported plans, and account-level rulesets for consistent multi-zone policy management.

| Requirement                          | Implementation Guidance                                                                                                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prevent origin bypass                | Restrict origin firewall/security groups to Cloudflare IP ranges and trusted private networks; enable authenticated origin pulls or equivalent origin authentication.        |
| Add broad API edge limit             | Create a WAF rate limiting rule matching the API hostname and `http.request.uri.path starts_with "/api/"`.                                                                   |
| Add strict auth edge limits          | Add separate rules for auth endpoints, especially `sign-in`, `sign-up`, `forgot-password`, `reset-password`, verification, and resend verification.                          |
| Choose counting characteristics      | Start with source IP; on plans that support it, add API key, cookie, header, JA3/JA4 fingerprint, ASN, country, or request body characteristics where they improve accuracy. |
| Use graduated actions                | Start in log/simulate mode, then use managed challenge or block for abusive clients once false positives are understood.                                                     |
| Exclude known safe traffic carefully | Exempt health checks, internal monitoring, and trusted office/VPN egress IPs with explicit expressions; avoid broad user-agent based exemptions.                             |
| Keep edge limits broader than app    | Cloudflare should block floods and obvious abuse; Express should remain the source of truth for email/name/user-aware throttling and exact auth behavior.                    |
| Monitor and tune                     | Use Cloudflare Security Analytics/request-rate analysis and app `429` metrics to tune thresholds before enforcing hard blocks.                                               |
| Manage as code                       | Prefer Terraform or Cloudflare Rulesets API for repeatable rule deployment across `dev`, `staging`, and `production`.                                                        |

Suggested Cloudflare rule set:

| Rule Name               | Match Expression                                                                                                                                                 | Characteristic                                          | Starting Limit         | Action                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------- | ------------------------------------------ |
| `api-global`            | `http.host eq "api.example.com" and http.request.uri.path starts_with "/api/"`                                                                                   | Source IP                                               | `600` requests / `60`s | Log first, then challenge or block         |
| `auth-signin`           | `http.host eq "api.example.com" and http.request.uri.path eq "/api/auth/v1/sign-in"`                                                                             | Source IP; add fingerprint if present                   | `20` requests / `60`s  | Managed challenge, then block after tuning |
| `auth-password-reset`   | `http.host eq "api.example.com" and http.request.uri.path in {"/api/auth/v1/forgot-password" "/api/auth/v1/reset-password"}`                                     | Source IP; add email/body field if plan supports it     | `10` requests / `600`s | Managed challenge or block                 |
| `auth-signup-verify`    | `http.host eq "api.example.com" and http.request.uri.path in {"/api/auth/v1/sign-up" "/api/auth/v1/verify-email" "/api/auth/v1/resend-email-verification-link"}` | Source IP; add fingerprint if present                   | `15` requests / `600`s | Managed challenge or block                 |
| `admin-sensitive-write` | `http.host eq "api.example.com" and http.request.uri.path starts_with "/api/user-management/"`                                                                   | Source IP and authenticated session cookie if available | `60` requests / `60`s  | Log first, then challenge                  |

Enterprise-grade completion checklist:

| Control                         | Done When                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Edge cannot be bypassed         | Direct origin IP requests fail unless they come from Cloudflare or trusted internal networks.                                                    |
| Cloudflare rules are versioned  | Rate limiting rules live in Terraform or another reviewed infrastructure-as-code workflow.                                                       |
| Nginx rules are versioned       | `limit_req_zone`, `limit_req`, `limit_conn`, and real-IP settings are committed with deployment config and reviewed like application code.       |
| Thresholds are traffic-based    | Limits are based on production/staging traffic percentiles and load tests, not guesses.                                                          |
| App metrics correlate with edge | Cloudflare/Nginx `429` events and Express `ERROR_TYPES.RATE_LIMIT` responses are visible in dashboards and alerts.                               |
| Failover behavior is tested     | Redis outage, Cloudflare bypass attempt, Nginx limit trigger, and app-level route limit trigger are tested in staging.                           |
| Exceptions are explicit         | Monitoring, trusted internal tools, and office/VPN egress IPs are allowlisted by exact IP/range or mTLS identity, not by user-agent strings.     |
| Runbooks exist                  | On-call engineers know how to identify a false positive, temporarily raise a limit, or block an active attack without changing application code. |

## Sub-flows

| Sub-flow                 | Branch Condition                                                   | Runtime Behavior                                                                                   |
| ------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Request identity branch  | `checkEmail === true` or `identityBodyFields` matches a body value | The value is trimmed, lowercased, hashed, and used as `{field}:{hash}` in the route key.           |
| Authenticated branch     | No request identity, but `res.locals.userId` is present            | User ID is hashed and used as `user:{hash}` in the route key.                                      |
| Anonymous branch         | No request identity and no authenticated user ID                   | Route key uses `anonymous`, still scoped by route hash and IP hash.                                |
| Redis connected branch   | `redisClient.isRedisConnected() === true`                          | Counters and bans are shared through Redis.                                                        |
| Redis unavailable branch | Redis disconnected or increment fails open                         | Uses process-local memory counters up to `MAX_MEMORY_COUNTERS=10000`; expired counters are pruned. |

## Design Rationale

| Decision                                                  | Why It Exists                                                                                 | Trade-off                                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Hash IP, request body identity, user ID, and route scopes | Avoids storing raw personal identifiers in Redis keys while preserving deterministic buckets. | Debugging Redis keys requires reproducing the hash locally.                      |
| Use route hash in route-specific keys                     | Prevents unrelated endpoints from sharing one request/IP counter.                             | A route path change starts a fresh counter namespace.                            |
| Use only `req.ip`                                         | Respects Express `trust proxy` and avoids trusting spoofable raw forwarding headers.          | Requires reverse proxy configuration to match `app.set("trust proxy", 1)`.       |
| Remove crawler bypass                                     | User-Agent is spoofable and should not bypass API abuse protections.                          | Legitimate crawlers hitting API routes are limited like any other client.        |
| Add memory fallback                                       | Redis outage should not fully disable abuse protection on a running instance.                 | Fallback is per process and does not coordinate across multiple API instances.   |
| Keep local `development` relaxed only                     | Public `dev`, `staging`, and `production` environments need real abuse protection.            | Manual testing in deployed dev environments must respect production-like limits. |
| Use `Retry-After`                                         | Gives clients a standards-based cooldown hint for `429` responses.                            | Clients must choose whether to honor it.                                         |

## Error Catalogue

| Error / Message                                                                    | Trigger                                                       | HTTP status | Thrown by                                                      |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------- | -------------------------------------------------------------- |
| `Rate limit exceeded. Try again in {seconds} seconds`                              | Global or route-specific counter is above `maxRequests`.      | `429`       | `throwRateLimitExceeded()`                                     |
| `Suspicious activity detected. IP temporarily banned.`                             | Rapid counter exceeds `500` requests in `10` seconds.         | `429`       | `globalRateLimiting()`                                         |
| `IP temporarily banned due to suspicious activity. Try again in {seconds} seconds` | `rate-limit:banned:{ipHash}` exists in Redis or `memoryBans`. | `429`       | `globalRateLimiting()`                                         |
| Redis temporary ban write failure                                                  | Redis write fails after memory ban is already set.            | None        | Logged by `setTemporaryBan()`; request still follows ban path. |

## Related Documents

| Document                       | Path                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------- |
| Express best practices         | `apps/backend/docs/express-best-practices.md`                                |
| Nginx request limiting docs    | `https://nginx.org/en/docs/http/ngx_http_limit_req_module.html`              |
| Cloudflare rate limiting docs  | `https://developers.cloudflare.com/waf/rate-limiting-rules/`                 |
| Cloudflare rate limit tuning   | `https://developers.cloudflare.com/waf/rate-limiting-rules/find-rate-limit/` |
| Rate-limit constants           | `apps/backend/src/constants/rate-limiting-values.ts`                         |
| Rate-limit middleware          | `apps/backend/src/middleware/rate-limit.middleware.ts`                       |
| App middleware registration    | `apps/backend/src/app/app.ts`                                                |
| Auth route limiter usage       | `apps/backend/src/modules/auth/v1/auth.routes.ts`                            |
| Role route limiter usage       | `apps/backend/src/modules/user-management/roles/roles.routes.ts`             |
| Permission route limiter usage | `apps/backend/src/modules/user-management/permissions/permissions.routes.ts` |

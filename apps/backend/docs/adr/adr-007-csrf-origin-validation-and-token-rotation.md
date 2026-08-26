# ADR-007: CSRF Origin Validation and Token Rotation

| Field        | Value        |
| ------------ | ------------ |
| **Status**   | Accepted     |
| **Date**     | 2026-05-31   |
| **Deciders** | Backend Team |

---

## Context

The backend uses cookie-based authentication. In production-like environments, session cookies can be sent by browsers on cross-site requests depending on the cookie settings and request context.

That means every authenticated state-changing route must be protected against CSRF. A CSRF attack does not need to read the response; it only needs the victim's browser to send a request with the victim's cookies attached.

Before this decision, CSRF protection relied mainly on the double-submit cookie pattern:

- the server set a readable CSRF cookie
- the frontend copied that value into the `X-CSRF-Token` header
- the backend verified that the header and cookie matched and that the token signature was valid

That pattern is useful, but we also want a browser-origin check. Origin validation blocks many cross-site attempts before token validation and gives us a clear trusted-origin boundary for browser clients.

The system also needed a consistent rule for CSRF token refresh. If a token stays static for a long session, stale tokens are more likely to remain usable in frontend memory, browser tabs, logs, or debugging tools. Rotating the CSRF cookie after successful unsafe requests reduces that window in normal browser flows.

---

## Decision

**State-changing browser requests protected by `csrfProtection()` must pass both trusted-origin validation and CSRF token validation.**

For unsafe HTTP methods, such as `POST`, `PUT`, `PATCH`, and `DELETE`, the middleware now validates in this order:

1. Check the request `Origin` header.
2. Fall back to `Referer` when `Origin` is unavailable.
3. Reject present origins that are not in the trusted site list.
4. In production-like environments, reject requests with no trusted origin.
5. Validate the double-submit CSRF token cookie/header pair.
6. Rotate the CSRF cookie after successful validation by default.

### Trusted origins

Trusted origins are derived from `SITE_SUBDOMAINS`.

Production-like environments only trust HTTPS origins. Local and test environments may trust non-HTTPS origins to support local frontend/backend development.

Any present untrusted origin is rejected in every environment.

### Missing Origin or Referer

Production-like environments require a trusted `Origin` or `Referer` by default.

Local and test environments allow missing origins by default because many test clients and local tooling do not send browser-origin headers. Tests or sensitive local routes can still force the stricter behavior with `requireTrustedOrigin: true`.

### Token rotation

`csrfProtection()` defaults to:

```typescript
refreshOnSuccess = true;
```

After a request passes origin validation and CSRF token validation, the middleware calls `setCsrfCookie()` to generate and set a fresh signed CSRF token cookie.

This is cookie rotation, not server-side one-time-token invalidation. The token remains stateless and is still validated by signature and expiry. In normal browser usage, the new cookie overwrites the old one, so a stale header value will no longer match the current cookie on the next unsafe request.

### Safe requests and token bootstrapping

Safe HTTP methods, such as `GET`, `HEAD`, and `OPTIONS`, do not require CSRF validation.

Routes that need to give the frontend a CSRF token without validating a mutation use `ensureCsrfToken()`. The primary example is authenticated session bootstrap:

```typescript
authRoutesV1.get(
  "/session-info",
  isAuthenticated(),
  ensureCsrfToken(),
  sessionInfoController as RequestHandler,
);
```

Use `ensureCsrfToken()` to issue or refresh a CSRF cookie. Use `csrfProtection()` to protect state-changing routes.

---

## Consequences

### Positive

- Cross-site state-changing requests are rejected before token validation when the browser origin is not trusted.
- Production-like environments fail closed when browser-origin information is missing.
- Local and test environments remain practical for non-browser clients and focused middleware tests.
- CSRF token cookies rotate after successful unsafe requests by default.
- Frontend code is encouraged to read the current CSRF cookie before each unsafe request instead of caching one token for the whole session.
- The distinction between token issuance and token validation is explicit:
  - `ensureCsrfToken()` issues or refreshes a token.
  - `csrfProtection()` validates unsafe requests.

### Trade-offs

- Non-browser API clients calling protected cookie-authenticated mutation routes must send a trusted `Origin` or `Referer` in production-like environments.
- If a legitimate browser flow runs from a new frontend origin, that origin must be added to `SITE_SUBDOMAINS` before protected mutations will work.
- Stateless CSRF rotation does not invalidate every previous token server-side. It relies on cookie overwrite, token expiry, and header/cookie matching.
- Multiple open tabs can temporarily race if one tab rotates the cookie and another tab submits a stale in-memory token. Frontend clients should read the CSRF cookie immediately before each unsafe request.

---

## Alternatives Considered

| Option                                             | Rejected reason                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Keep only double-submit cookie validation          | Does not explicitly enforce that browser mutations originate from trusted frontend origins.              |
| Require Origin/Referer in every environment        | Breaks local tests and some development tooling that do not behave like browsers.                        |
| Disable token rotation                             | Leaves one CSRF token usable for the full expiry window in normal browser flows.                         |
| Store every CSRF token server-side as one-time use | Stronger replay protection, but adds server state, storage churn, tab-race complexity, and cleanup work. |
| Use `ensureCsrfToken()` on mutation routes         | It only issues a token and does not validate the request, so it is not sufficient for CSRF protection.   |

---

## Future Guidance

When adding or changing routes:

- Use `csrfProtection()` on cookie-authenticated state-changing routes.
- Use `ensureCsrfToken()` only on safe bootstrap routes that need to issue or refresh the readable CSRF cookie.
- Do not disable `refreshOnSuccess` unless a specific route has a documented compatibility reason.
- Add any new trusted frontend origin to `SITE_SUBDOMAINS` before deploying routes that depend on it.
- Keep production-like environments strict: missing `Origin` and `Referer` should remain rejected for unsafe requests.
- Frontend clients should read the CSRF cookie fresh before each unsafe request.
- If replay resistance requirements increase, revisit this ADR and evaluate server-side one-time CSRF token storage.

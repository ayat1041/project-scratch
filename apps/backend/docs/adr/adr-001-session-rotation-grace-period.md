# ADR-001: Grace Period for Session Token Rotation Race Condition

| Field           | Value                                           |
| --------------- | ----------------------------------------------- |
| **Status**      | Accepted                                        |
| **Date**        | 2026-04-23                                      |
| **Deciders**    | Backend Team                                    |
| **Related doc** | [session-auth-flow.md](../session-auth-flow.md) |

---

## Context

The system uses a single encrypted session token with **sliding-window rotation**: when a token's age exceeds a threshold (`SESSION_REFRESH_THRESHOLD`, default 15mins), the backend automatically issues a new token and marks the old one with `rotatedTo = NEW_JTI` in the database.

This rotation is triggered by the **Next.js middleware**, which calls `GET /api/auth/v1/session-info` on every page navigation to validate the session. The new cookie is delivered to the browser inside the HTTP response of that call.

### The problem

A race condition exists between rotation and cookie delivery:

```
T+0ms   Request A arrives (page navigation) → token age > threshold
T+1ms     DB: INSERT new session (NEW_JTI)
T+2ms     DB: UPDATE old session → rotatedTo = NEW_JTI    ← written to DB
T+3ms   Request B arrives (another navigation, same old token)
T+3ms     DB lookup: OLD_JTI.rotatedTo IS SET → treated as ATTACK
T+3ms     DB: revoke entire session family
T+3ms   ← user is logged out
T+5ms   Response A returns to browser with Set-Cookie: NEW_TOKEN ← too late
```

The database write in step T+2ms is permanent and synchronous. The browser only learns about the new token when the HTTP response completes — which may be tens of milliseconds later. Any concurrent request in that window uses the old token and, under the previous implementation, would trigger immediate family revocation.

This was manifesting in production as **unexpected logouts** during normal navigation, especially noticeable with:

- Fast multi-tab usage
- Rapid link clicking
- Any page that fires multiple parallel requests after a navigation

---

## Decision

**We implement a "grace period" check before treating a rotated token as a replay attack.**

When a request arrives with a token whose `rotatedTo` field is set, we do not immediately revoke the family. Instead, we look up the **successor session** (the session identified by `rotatedTo`) and inspect its state:

| Successor state                                       | Interpretation                                                                   | Action                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Exists, not revoked, not expired, `rotatedTo IS NULL` | **Benign race** — rotation just happened, browser hasn't received new cookie yet | Accept request; re-issue the successor cookie; return `success: true` |
| Missing, revoked, expired, or `rotatedTo IS SET`      | **Genuine replay attack** or compromised chain                                   | Revoke entire family; return `success: false`                         |

### What "successor is alive" means

```
successorIsAlive =
    successorSession EXISTS
  AND successorSession.revokedAt IS NULL
  AND successorSession.expiresAt > NOW()
  AND successorSession.rotatedTo IS NULL    ← this is the critical check
```

The last condition — `successorSession.rotatedTo IS NULL` — is what distinguishes a race from an attack. If a real attacker replays the old token after the legitimate user has already made further requests, the successor will itself have been rotated or consumed, causing `rotatedTo` to be set on the successor. That flips `successorIsAlive` to `false` and the full revocation fires.

### What happens on the benign path

When a race is detected, we do not create a new session or issue a fresh rotation. We simply:

1. Re-sign the **existing** successor session into a new JWT.
2. Re-send the `session_token` and `csrf_token` cookies.
3. Return the successor's `userId` and `email` to the middleware.

The successor session itself is unchanged in the database. It will be rotated normally on its own next eligible request.

---

## Alternatives Considered

### Option A: Revoke immediately on any `rotatedTo` (previous behaviour)

**Rejected.** This was the original implementation and is what caused the production logouts. It treats every concurrent request as malicious, which is incorrect for a UI that fires multiple requests per navigation.

### Option B: Time-based grace window (e.g. accept rotated tokens for 30 seconds)

Allow a rotated token to be reused for a fixed time window after rotation.

**Rejected** for two reasons:

1. It requires storing a `rotatedAt` timestamp and comparing it on every request — added complexity for a weaker guarantee.
2. A 30-second window gives an attacker 30 seconds to exploit a stolen token after it has been rotated, even when the legitimate user has already moved on. The state-based approach (checking whether the successor is alive and unrotated) has **no exploitable time window** — it collapses as soon as the legitimate user makes another request.

### Option C: Eliminate rotation entirely; use short-lived JWTs + refresh tokens

Use a standard access token (15 min) + separate refresh token pattern.

**Rejected.** This would require the frontend to implement a token refresh loop and handle 401 responses. The single-token sliding-window approach was chosen to keep the client dumb — the middleware simply sends its cookie and receives a possibly-updated cookie in response, with no client-side refresh logic. Switching to a two-token pattern is a larger architectural change that is out of scope.

### Option D: Deduplicate concurrent requests in the Next.js middleware

Cache the session validation result for a short period in the edge runtime so concurrent navigations share one backend call.

**Partially considered.** The Next.js edge runtime does not expose a shared in-memory cache between concurrent requests in the same process in a reliable way. This would also require understanding which cache layer is safe to use across serverless invocations. The grace period fix is simpler, lives entirely in the backend, and requires no changes to the middleware.

### Option E: Distributed lock on session rotation

Acquire a lock on the session record (via Redis Redlock or a DB-level `SELECT FOR UPDATE`) at the point of rotation, so that concurrent requests are serialized and the old token cannot be presented to a second validator while rotation is in flight.

Two variants were considered:

**Variant 1 — Lock the rotation write**

Before performing the `INSERT NEW_JTI` + `UPDATE rotatedTo`, acquire `lock:session:{jti}` in Redis. Request B, arriving concurrently, either:

- Waits for the lock, then re-reads the session — but by the time it acquires the lock, `OLD_JTI.rotatedTo` is already set. It still faces the same semantic question: was this rotated legitimately or is it a replay attack? The lock serialized the writes but did not resolve the ambiguity. The grace period check is still needed.

**Variant 2 — `SELECT FOR UPDATE` on the token row**

Both Request A and Request B acquire a row-level lock before reading `OLD_JTI`. Request B blocks until Request A's transaction commits. When Request B reads the row it sees `rotatedTo = NEW_JTI` — same outcome as Variant 1.

**What locking does and does not solve:**

| Problem                                                                           | Locking fixes it?                                                               | Grace period fixes it?                                                                                               |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Two concurrent requests both trigger rotation of the same token (double-rotation) | ✅ Yes — serializes the writes, second request reads the already-rotated record | ✅ Implicitly — second rotation attempt finds `rotatedTo` set, falls into the grace path and re-issues the successor |
| Single rotation already committed, second request arrives with old token          | ❌ No — locking has already released by this point                              | ✅ Yes — inspects successor liveness                                                                                 |

Locking addresses a slightly different (and less common) problem: preventing two simultaneous requests from each independently triggering a rotation, creating a dangling orphan session (`NEW_JTI_A`) that is never pointed to because the second write overwrites `rotatedTo` with `NEW_JTI_B`. This is a real correctness concern but not the scenario that was causing production logouts.

**Rejected as the primary solution** because:

1. It requires Redis to be available on every authenticated request, introducing a new hard infrastructure dependency on the hot path.
2. Even with locking, the `rotatedTo IS SET` ambiguity remains — locking serializes access but does not tell the serialized second request whether it should accept or reject the old token. The state inspection in the grace period check is still the mechanism that resolves that question.
3. The grace period approach already handles double-rotation gracefully without locks: when both requests try to rotate the same token, the second rotation attempt is treated as a race (successor is alive), the existing successor is re-issued, and no orphan session is created.

**Could be complementary:** A `SELECT FOR UPDATE` on the session row during rotation would eliminate the double-rotation / orphan session scenario as an independent hardening measure. It is not implemented currently because the grace period already handles it implicitly, and adding `SELECT FOR UPDATE` to every rotation adds latency on the hot path. This can be revisited if orphan sessions become observable in monitoring.

---

## Consequences

### Positive

- Concurrent navigations no longer cause false logouts.
- The security guarantee of rotation-based replay detection is preserved — the attack surface is not widened by a time window, only by the liveness of the successor session.
- No changes to the database schema or to the Next.js middleware.
- One additional indexed DB lookup per race hit (negligible; races are rare and the `jti` column is a primary key).

### Negative / Trade-offs

- Adds one extra DB query on the rare race path. Under normal conditions (no concurrent requests within the rotation window) the extra query never fires.
- The security model is slightly more complex to reason about. A developer seeing `rotatedTo IS SET` and assuming it always means an attack would be wrong — this ADR documents why.
- An attacker who steals a token and replays it **within the same millisecond window** as a benign concurrent request from the legitimate user would pass the grace period check on that one request. This is an extremely narrow window (the legitimate user's next request will cause the successor to be consumed, triggering revocation). Preventing this would require distributed locking on the session record, which is not warranted by the threat model.

---

## Security Analysis of the Grace Period

The grace period is not exploitable in any practical way because it is **state-gated, not time-gated**.

The only way an attacker passes the grace period check is if they replay the old token at the exact moment the successor is still unrotated. The moment the legitimate user makes one more request (which fires session-info on every page load), the successor is rotated and the attacker's path closes permanently.

```
Attacker timeline (stolen OLD_JTI):

  T=0   Rotation fires: OLD_JTI → NEW_JTI
  T=1   Attacker replays OLD_JTI
        → lookup NEW_JTI: rotatedTo IS NULL → grace period passes
        → attacker gets ONE successful response
  T=2   Legitimate user navigates → NEW_JTI rotated → NEW_JTI.rotatedTo = NEWER_JTI
  T=3   Attacker replays OLD_JTI again
        → lookup NEW_JTI: rotatedTo IS SET → successorIsAlive = false
        → family REVOKED
```

The worst case is one successful attacker request in a very narrow race window. Mitigations that prevent token theft in the first place (HttpOnly cookies, Secure flag, short token age, CSRF protection) remain the primary defence. The rotation system is a secondary, defence-in-depth layer.

---

## References

- [session-auth-flow.md](../session-auth-flow.md) — Full sequence diagrams for the rotation, race condition, and attack scenarios
- OWASP: [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- Original rotation pattern: [Refresh Token Rotation — Auth0](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)

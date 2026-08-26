# Session Authentication Flow

Technical reference for the single-token session system used across the backend API and Next.js middleware.

---

## Overview

The system uses a **single encrypted session token** stored in an `HttpOnly` cookie. There are no separate access/refresh token pairs. Sessions are tracked in the database (`app_user_refresh_tokens` table), which allows server-side revocation, replay detection, and sliding-window renewal.

### Key constants

| Constant                    | Default                 | Description                      |
| --------------------------- | ----------------------- | -------------------------------- |
| `SESSION_TOKEN_AGE`         | `30 days`               | JWT expiry embedded in the token |
| `SESSION_COOKIE_MAX_AGE`    | `30 days`               | Cookie `Max-Age` attribute       |
| `SESSION_REFRESH_THRESHOLD` | `1 hour` (1 min in dev) | Age after which token is rotated |
| `CSRF_TOKEN_EXPIRY`         | `24 hours`              | CSRF cookie lifetime             |

---

## 1. Sign-in Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js Frontend
    participant BE as Express Backend
    participant DB as PostgreSQL
    participant Redis

    User->>FE: POST /auth/signin (email, password)
    FE->>BE: POST /api/auth/v1/sign-in

    BE->>DB: SELECT user WHERE email = ?
    DB-->>BE: userInfo (hashed password, roles, permissions)

    BE->>BE: validateSiteContextForUser(req, permissions)
    BE->>BE: bcrypt.compare(password, userInfo.password)

    alt password mismatch
        BE-->>FE: 400 "Email or password is incorrect"
    end

    BE->>BE: createSession(res, userId, email, req)
    Note over BE,DB: jti = randomUUID()<br/>familyId = randomUUID()

    BE->>DB: INSERT app_user_refresh_tokens<br/>(jti, familyId, userId, expiresAt, ip, deviceInfo)
    BE->>BE: encrypt({ id, email, jti, familyId }, "30 days")
    BE->>BE: setCsrfCookie(res, userId)

    BE-->>FE: 200 + JSON body<br/>Set-Cookie: session_token=JWT (HttpOnly, Secure)<br/>Set-Cookie: csrf_token=SIGNED_HMAC (readable by JS)

    FE-->>User: Redirect to allowedRoutes[0]
```

---

## 2. Accessing a Protected Route (Next.js Middleware)

Every request matching the middleware `matcher` config goes through this flow before the page renders.

```mermaid
flowchart TD
    A([Browser navigates to /dashboard]) --> B{session_token\ncookie present?}

    B -- No --> C[Redirect → /auth/signin?callbackUrl=...]
    B -- Yes --> D[Build cookie string\nsession_token + csrf_token]

    D --> E[fetch GET /api/auth/v1/session-info\nCookie: session_token=...\nOrigin: request.nextUrl.origin]

    E --> F{Backend response}

    F -- Network error --> G[Redirect → /auth/signin?error=backend_unavailable]
    F -- 403 Forbidden --> H[Redirect → /access-denied]
    F -- 4xx / 5xx --> I[Redirect → /auth/signin?error=user_must_be_registered]
    F -- 200 OK --> J[Parse sessionData.allowedRoutes]

    J --> K{currentPath in\nallowedRoutes?}
    K -- No --> L[Redirect → allowedRoutes 0 or /]
    K -- Yes --> M[NextResponse.next]

    M --> N{Backend sent\nSet-Cookie headers?}
    N -- Yes --> O[response.headers.append set-cookie\nfor each cookie via getSetCookie]
    N -- No --> P([Page renders])
    O --> P
```

---

## 3. Session Validation (Backend `validateSessionToken`)

This runs on every authenticated endpoint, including `GET /session-info` called by the Next.js middleware.

```mermaid
flowchart TD
    A([sessionToken received]) --> B[decrypt JWT\nusing jose jwtVerify]

    B --> C{JWT error?}
    C -- ERR_JWT_EXPIRED --> D[clearCookie\nthrow 401 UNAUTHORIZED]
    C -- Other error / no jti --> E[clearCookie\nthrow 401 UNAUTHORIZED]
    C -- Valid --> F

    F[SELECT session FROM DB\nWHERE jti = payload.jti] --> G{Session found?}

    G -- Not found --> H[clearCookie\nreturn success: false]
    G -- revokedAt IS SET --> H
    G -- expiresAt in past --> H

    G -- Valid session --> I{session.rotatedTo\nIS SET?}

    I -- No --> J[Check token age\nvs SESSION_REFRESH_THRESHOLD]
    I -- Yes --> K[SELECT successorSession\nWHERE jti = session.rotatedTo]

    K --> L{successorIsAlive?\nnot revoked\nnot expired\nnot itself rotated}

    L -- Yes → Benign race --> M[Re-encrypt successor JWT\nRe-send cookies\nreturn success: true]
    L -- No → Genuine attack --> N[UPDATE SET revokedAt\nWHERE familyId = session.familyId\nclearCookie\nreturn success: false]

    J --> O{tokenAge >\nSESSION_REFRESH_THRESHOLD?}
    O -- No --> P[return success: true\nuserId, email]
    O -- Yes --> Q[rotateSessionToken]
    Q --> P
```

---

## 4. Session Rotation (Sliding Window)

Triggered when the token's age exceeds `SESSION_REFRESH_THRESHOLD`.

```mermaid
sequenceDiagram
    participant MW as validateSessionToken
    participant DB as PostgreSQL
    participant Res as HTTP Response

    Note over MW: tokenAge > threshold

    MW->>DB: INSERT app_user_refresh_tokens<br/>{ newJti, familyId (same), userId, expiresAt+30d }
    MW->>DB: UPDATE app_user_refresh_tokens<br/>SET rotatedTo = newJti<br/>WHERE jti = currentJti

    MW->>MW: encrypt({ id, email, jti:newJti, familyId }, "30 days")
    MW->>Res: Set-Cookie: session_token=NEW_JWT (HttpOnly)
    MW->>Res: Set-Cookie: csrf_token=NEW_SIGNED_HMAC (readable)

    Note over DB: Old record: rotatedTo = newJti (NOT revoked)<br/>New record: rotatedTo = NULL (active)
```

The old record is **not revoked** — it is only marked `rotatedTo`. This is intentional: it allows the benign race detection to verify the successor is still alive.

---

## 5. Rotation Race Condition and Grace Period

When the Next.js middleware fires `GET /session-info` concurrently (e.g. two navigations within milliseconds), Request A rotates the session and writes `rotatedTo` to the DB before its own response returns the new cookie to the browser. Request B, using the same old token, hits the `rotatedTo` check.

```mermaid
sequenceDiagram
    actor Browser
    participant MW_A as Middleware (Req A)
    participant MW_B as Middleware (Req B)
    participant BE as Backend validateSessionToken
    participant DB as PostgreSQL

    Browser->>MW_A: navigate to /page-1 (OLD_TOKEN)
    Browser->>MW_B: navigate to /page-2 (OLD_TOKEN, concurrent)

    MW_A->>BE: GET /session-info (OLD_TOKEN)
    MW_B->>BE: GET /session-info (OLD_TOKEN)

    BE->>DB: [Req A] tokenAge > threshold → INSERT NEW_JTI
    BE->>DB: [Req A] UPDATE OLD_JTI.rotatedTo = NEW_JTI

    BE->>DB: [Req B] SELECT WHERE jti = OLD_JTI
    Note over DB: OLD_JTI.rotatedTo = NEW_JTI  ← already set!

    BE->>DB: [Req B] SELECT successor WHERE jti = NEW_JTI
    DB-->>BE: [Req B] successorSession { revokedAt: null, rotatedTo: null }
    Note over BE: successorIsAlive = true → Benign race

    BE-->>MW_A: 200 + Set-Cookie: NEW_TOKEN
    BE-->>MW_B: 200 + Set-Cookie: NEW_TOKEN (re-issued)

    MW_A-->>Browser: Set-Cookie: NEW_TOKEN
    MW_B-->>Browser: Set-Cookie: NEW_TOKEN
    Note over Browser: Both responses deliver same new token.<br/>Browser stores it. No logout.
```

### Genuine replay attack path

```mermaid
sequenceDiagram
    actor Attacker
    actor LegitUser
    participant BE as Backend
    participant DB as PostgreSQL

    Note over LegitUser,DB: Normal usage after rotation<br/>OLD_JTI → NEW_JTI → NEWER_JTI

    Attacker->>BE: GET /api/* with OLD_TOKEN (stolen)
    BE->>DB: SELECT WHERE jti = OLD_JTI
    Note over DB: OLD_JTI.rotatedTo = NEW_JTI

    BE->>DB: SELECT successor WHERE jti = NEW_JTI
    Note over DB: NEW_JTI.rotatedTo = NEWER_JTI  ← legitimate user consumed it

    Note over BE: successorIsAlive = false<br/>(successor.rotatedTo is SET)

    BE->>DB: UPDATE SET revokedAt = NOW()<br/>WHERE familyId = session.familyId
    Note over DB: ALL sessions in this family revoked
    BE-->>Attacker: success: false (family revoked)

    Note over LegitUser: On next request → session revoked → must re-login
    Note over LegitUser: User is notified their session was compromised
```

---

## 6. CSRF Protection

Uses the **Double-Submit Cookie Pattern**.

```mermaid
flowchart LR
    subgraph Login
        A[createSession] -->|setCsrfCookie| B[csrf_token cookie\nNOT HttpOnly\nreadable by JS]
    end

    subgraph Every mutating request POST PUT PATCH DELETE
        C[Frontend reads csrf_token cookie] --> D[Sends X-CSRF-Token: value in header]
        D --> E[csrfProtection middleware]
        E --> F{header token\n== cookie token?}
        F -- No --> G[403 CSRF validation failed]
        F -- Yes --> H[verifyCsrfToken\nHMAC signature check\nexpiry check\nuserId binding check]
        H -- Invalid --> G
        H -- Valid --> I[next]
    end

    subgraph Token rotation
        J[Session rotated] -->|setCsrfCookie| K[New csrf_token issued\nalongside new session_token]
    end
```

**Token format:** `timestamp.random.userId.hmacSignature`

- `timestamp` — used to enforce 24-hour expiry
- `userId` — bound to the authenticated user, prevents token swapping between accounts
- `hmacSignature` — HMAC-SHA256 signed with `CSRF_SECRET`, truncated to 32 hex chars

---

## 7. Sign-out Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    User->>FE: click Sign Out
    FE->>BE: POST /api/auth/v1/sign-out

    BE->>BE: destroySession(req, res)
    BE->>BE: decryptToken(sessionToken) → payload.familyId

    alt allDevices = true
        BE->>DB: UPDATE SET revokedAt = NOW()<br/>WHERE userId = session.userId
    else single device (default)
        BE->>DB: UPDATE SET revokedAt = NOW()<br/>WHERE familyId = payload.familyId
    end

    BE->>BE: clearCookie(session_token)
    BE->>BE: clearCookie(csrf_token)
    BE-->>FE: 200
    FE-->>User: Redirect → /auth/signin
```

---

## 8. Session DB Schema

```
app_user_refresh_tokens
─────────────────────────────────────────
jti          UUID  PRIMARY KEY   ← unique token ID (stored in JWT)
familyId     UUID  NOT NULL      ← groups all rotations from one login
userId       UUID  NOT NULL FK
expiresAt    TIMESTAMP NOT NULL
revokedAt    TIMESTAMP NULL      ← set on logout or attack detection
rotatedTo    UUID NULL           ← jti of successor token after rotation
ip           TEXT
deviceInfo   JSONB               ← os, browser, device, engine
createdAt    TIMESTAMP DEFAULT NOW()
```

### State machine for a single session record

```
 [ACTIVE]
    │
    ├─ token age > threshold ──→ rotatedTo = NEW_JTI  →  [ROTATED]  (successor created)
    │
    ├─ logout ─────────────────→ revokedAt = NOW()    →  [REVOKED]
    │
    └─ attack detected ─────────→ revokedAt = NOW()   →  [REVOKED]
       (all family members)
```

Only records where `rotatedTo IS NULL AND revokedAt IS NULL AND expiresAt > NOW()` are considered active (used by `getActiveSessions`).

---

## 9. Cookie Attributes Reference

| Cookie          | HttpOnly                 | SameSite (dev) | SameSite (prod) | Secure    | Domain (prod)  |
| --------------- | ------------------------ | -------------- | --------------- | --------- | -------------- |
| `session_token` | ✅                       | `Lax`          | `None`          | prod only | `.example.com` |
| `csrf_token`    | ❌ (must be JS-readable) | `Lax`          | `Strict`        | prod only | `.example.com` |

`session_token` uses `SameSite=None` in production because the frontend (`example.com`) and backend API (`api.example.com`) are on different subdomains — a cross-site context. `Secure` is required when `SameSite=None`.

`csrf_token` uses `SameSite=Strict` because it only needs to be readable by the same-origin JS, and strict provides stronger CSRF protection for the cookie itself.

# ADR-006: Controlled Signup Availability Checks

| Field        | Value        |
| ------------ | ------------ |
| **Status**   | Accepted     |
| **Date**     | 2026-05-30   |
| **Deciders** | Backend Team |

---

## Context

The public signup form needs to warn users when an email is already unavailable.

The relevant public endpoint is:

- `POST /api/auth/v1/check-email-uniqueness`

From a security perspective, this endpoint creates an enumeration risk because an unauthenticated caller can test whether a value is already in use.

During auth hardening, we considered making this endpoint fully neutral by always returning a generic successful response. That would reduce enumeration but would break the client requirement: users would no longer get immediate availability feedback in the signup form.

The system therefore needs a product-security trade-off:

- Keep signup availability feedback.
- Avoid returning any account details.
- Make automated scraping expensive through rate limiting.
- Keep the final signup submit path from leaking richer duplicate-state details.

---

## Decision

**Keep the public availability endpoint, but constrain the response to a boolean availability result.**

The endpoint returns `200` for available and unavailable values:

```json
{
  "success": true,
  "message": "Available",
  "data": {
    "isUnique": true
  }
}
```

or:

```json
{
  "success": true,
  "message": "Not available",
  "data": {
    "isUnique": false
  }
}
```

It must not return:

- user ids
- provider information
- verification state
- deleted state
- roles or permissions
- hints like "use Google sign-in", "resend verification", or "already verified"

### Email availability rule

`check-email-uniqueness` normalizes the email and checks for an existing user.

The endpoint returns:

- `isUnique=true` when no verified user owns the email.
- `isUnique=false` when a verified user already owns the email.

This intentionally allows an existing unverified signup to continue through the signup flow. The signup service can update the unverified user and rotate the verification token.

### Final signup submit behavior

`POST /api/auth/v1/sign-up` remains the authoritative mutation endpoint.

Duplicate email conflicts on the final submit path return the neutral public signup response instead of a detailed duplicate-account error. This prevents callers from bypassing the precheck endpoint to get richer information from the mutation endpoint.

### Rate limiting behavior

The auth signup rate-limit config applies to the availability check and signup submit flow.

The route limiter supports request body identity fields:

```typescript
identityBodyFields: ["name"];
```

For the signup availability route, the limiter scopes counters by:

- route
- client IP
- normalized email when present

The values are hashed before being placed into Redis or in-memory counter keys.

### Frontend behavior

The signup UI reads only:

```typescript
data.isUnique;
```

and displays:

- green available state for `true`
- unavailable warning for `false`

The form also performs a final availability check during submit before calling `/sign-up`, so stale or still-running debounce checks cannot allow an obviously unavailable value through the UI.

---

## Consequences

### Positive

- Signup still meets the client requirement for immediate email availability feedback.
- Public responses expose only the minimum information needed by the UI.
- Available and unavailable values use the same HTTP status and response shape.
- The final signup mutation path does not leak richer duplicate-state details.
- Rate-limit keys can distinguish repeated checks for the same email without storing raw personal identifiers.
- The frontend cannot submit while the availability check is in flight and rechecks availability before signup.

### Trade-offs

- The public availability endpoint still exposes whether a value is available. This is unavoidable while the product requires this UX.
- Attackers can still enumerate values slowly unless edge controls, monitoring, and abuse response are in place.
- Availability is a point-in-time check. Another request can claim the same value after the precheck but before submit, so `/sign-up` must remain authoritative.
- The email endpoint intentionally treats unverified users as available for signup continuation. This is useful for incomplete signup recovery, but it must not expose verification state directly.

---

## Alternatives Considered

| Option                                           | Rejected reason                                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Always return `isUnique=true`                    | Best for anti-enumeration, but breaks the required signup UX.                                       |
| Return `409` or `422` for unavailable values     | Makes unavailable values easier to classify by status code and complicates frontend handling.       |
| Return detailed account messages                 | Leaks unnecessary state such as verified/unverified status.                                          |
| Check only during final signup submit            | Reduces enumeration surface, but users lose immediate availability feedback while filling the form. |
| Require authentication for signup prechecks      | Not possible because the user is not authenticated before signup.                                   |

---

## Future Guidance

When changing signup availability behavior:

- Keep the response shape stable: `success`, `message`, `data.isUnique`.
- Do not add account, provider, role, or verification details to public responses.
- Keep unavailable responses as `200` with `isUnique=false`.
- Keep `/sign-up` authoritative and neutral on duplicate conflicts.
- Update the frontend submit-time availability check if the endpoint name or response contract changes.
- Update Swagger and auth runtime docs whenever this contract changes.
- If abuse increases, add Cloudflare Turnstile or another challenge before this endpoint rather than adding more detailed backend responses.

If the product no longer needs live availability feedback, revisit this ADR and consider replacing the public precheck endpoint with a neutral validation-only response.

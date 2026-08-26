> **Status:** Approved
> **Version:** 1.1.0
> **Author:** Backend team
> **Last updated:** 2026-07-28
> **Module:** `src/infrastructure/events/`, `src/workers/email-send-consumer.ts`

# How Email Sending Works Now: RabbitMQ, Step by Step

## Overview / Purpose

Every email the backend sends — signup verification, password reset,
resend-verification, OAuth welcome emails — goes through the **same
RabbitMQ pipeline**, not a direct call to an email library. A
controller/service never sends an email itself; it publishes an event and
moves on. A separate, independent process (`email-send-consumer.ts`) picks
that event up and does the actual sending.

This doc explains that pipeline end to end, using
[`sign-up.controller.ts`](../../src/modules/auth/features/F1001-signup/controllers/sign-up.controller.ts)'s
verification-email step as the worked example. The mechanism is identical
for every other email in the app (`forgot-password.controller.ts`,
`resend-email-verification.controller.ts`, `google-signin-controller.ts`,
`linkedin-signin-controller.ts`) — only the routing key, payload, and email
template change.

Why this exists at all: sending an email is a network call to an SMTP
server (Nodemailer) or Mailhog. Doing that *inside* the HTTP request means
the signup response can't return until the email provider responds —
slower requests, and a flaky email provider becomes a flaky signup
endpoint. Publishing to a queue instead means the HTTP response returns
the instant the event is handed off, and email delivery happens
out-of-band with its own retry logic.

## Components

| Component                      | Real name                                  | What it does                                                                                        |
| ------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Publisher interface              | `EventPublisher` (`event-publisher.types.ts`) | The contract every producer codes against — `publish(routingKey, payload, opts?)`.                   |
| Shared publisher instance         | `eventPublisher` (`event-publisher.ts`)      | A single shared instance, imported by every controller/service that sends an event.                   |
| RabbitMQ implementation          | `rabbitMqEventPublisher` (`rabbitmq-event-publisher.ts`) | Publishes to the shared `starter.events` exchange over an amqp-connection-manager channel. A plain object implementing `EventPublisher` — function-style, not a class. |
| Connection/channel manager       | `getRabbitChannel()` (`rabbitmq-connection.ts`) | One shared, auto-reconnecting channel for the whole process; runs topology setup on connect.          |
| Topology (exchange/queue/DLX)    | `assertEventsTopology()` (`rabbitmq-topology.ts`) | Declares the exchange, `email-queue`, its `.retry` holding queue, and its `.dlq`.                     |
| Queue / worker / routing-key names | `QUEUES`, `WORKERS`, `ROUTING_KEYS` (`constants/queues.ts`, `constants/workers.ts`, `constants/routing-keys.ts`) | Single source of truth for every queue name, worker name, and routing key string — no more duplicated literals between the topology and each consumer/producer. |
| Shared email payload type        | `EmailJob` (`infrastructure/events/email-job.types.ts`) | The `{to, from, subject, html, text}` shape, used by every producer and the consumer — a field rename now fails at compile time. |
| Consumer process                 | `email-send-consumer.ts`                     | A standalone Node process, always running, that consumes `email-queue` and actually sends the email.  |
| Email transport                  | `sendEmailWithNodemailer` / `sendEmailUsingMailhog` (`infrastructure/email/emails.ts`) | The only two functions in the codebase that actually talk to an SMTP server. Called exclusively from inside the consumers now. |
| DLQ depth polling                | `getQueueDepth()` (`infrastructure/events/rabbitmq-management.ts`), `dlqDepthCheckJob` (`cron-manager.service.ts`) | Every 5 minutes, hits the RabbitMQ management HTTP API per queue in `QUEUE_BINDINGS` and logs an error when a `.dlq` is non-empty. |

## Flow Diagram

```
 HTTP request                              email-send-consumer.ts (separate process)
 POST /api/auth/v1/sign-up                 ────────────────────────────────────────
      │
      ▼
 ┌─────────────────────────┐
 │ signupController         │   1. validate input, create user,
 │ (sign-up.controller.ts)  │      generate verification token
 └────────────┬─────────────┘
              │ 2. build emailData { from, to, subject, html }
              ▼
 ┌─────────────────────────┐
 │ eventPublisher.publish(   │   3. hand off to RabbitMQ, wrapped in
 │   "notification.email.    │      try/catch — a publish failure is
 │    send", emailData)      │      logged, never blocks the response
 └────────────┬─────────────┘
              │ 4. amqp publish to "starter.events" exchange
              ▼                                                    ┌───────────────────────────┐
 ┌─────────────────────────┐   5. topic exchange routes by         │ ch.consume("email-queue")  │
 │  starter.events exchange  │──────routing key───────────────────▶│  (prefetch 10)             │
 │  (topic)                  │      "notification.email.send"       └──────────────┬─────────────┘
 └─────────────────────────┘       → bound queue: "email-queue"                    │
              │                                                                     │ 6. handleMessage(msg)
              ▼ (nothing further happens                                            ▼
                 in the request — it already                        ┌───────────────────────────┐
                 returned res.status(200))                           │ sendEmailWithNodemailer /  │
                                                                       │ sendEmailUsingMailhog      │
                                                                       └──────────────┬─────────────┘
                                                                                       │
                                                                  success ◀────────────┴────────────▶ failure
                                                                       │                                  │
                                                                       ▼                                  ▼
                                                                ┌─────────────┐              ┌─────────────────────┐
                                                                │ ch.ack(msg)  │              │ x-death.length check │
                                                                │ done         │              └──────────┬───────────┘
                                                                └─────────────┘                            │
                                                                              < MAX_RETRY_COUNT (10) ───────┼─── ≥ MAX_RETRY_COUNT
                                                                              ▼                             ▼
                                                                ┌─────────────────────┐      ┌───────────────────────────┐
                                                                │ ch.nack(msg,false,   │      │ ch.sendToQueue(            │
                                                                │  false) → dead-      │      │  "email-queue.dlq", ...)   │
                                                                │  letters to           │      │ ch.ack(msg) — terminal     │
                                                                │  "email-queue.retry"  │      └───────────────────────────┘
                                                                │  (5s TTL, then back   │
                                                                │  to email-queue)      │
                                                                └─────────────────────┘
```

## Step-by-Step Reference (worked example: `signupController`)

### Step 1 — Controller does its normal work first

- **File:** `sign-up.controller.ts`
- **Actor:** the signup request itself
- **Effect:** validates the payload, creates/finds the user
  (`getOrCreateUserOnSignUp`), generates a JWT verification token, and
  persists it (`deleteAndInsertEmailVerificationToken`). None of this
  touches RabbitMQ yet.

### Step 2 — Build the email payload

- **File:** `sign-up.controller.ts:107-116`
- **Effect:** builds a plain object —
  `{ from, to, subject, html }` — where `html` comes from
  `onRegisterVerificationEmail(...)` (the actual email template/content).
- **Note:** this is the same shape every producer in the app builds, and it
  is now a formal shared type — `EmailJob`
  (`infrastructure/events/email-job.types.ts`). Every producer annotates
  its constructed object as `EmailJob` before publishing, and
  `email-send-consumer.ts` imports the same type instead of a local
  duplicate, so a field rename fails at compile time instead of silently
  at runtime.

### Step 3 — Publish, don't send

- **File:** `sign-up.controller.ts:118-125`
- **Effect:**
  ```ts
  const emailData: EmailJob = { from, to: email, subject, html };

  try {
    await eventPublisher.publish(ROUTING_KEYS.NOTIFICATION_EMAIL_SEND, emailData);
  } catch (error) {
    logger.error("Failed to publish signup verification email", { error });
  }
  ```
- **Guard/failure behavior:** a publish failure (RabbitMQ unreachable,
  channel error) is caught and logged — it does **not** throw, and does
  **not** fail the signup request. The user still gets a `200` and a
  created account even if the verification email couldn't be queued. This
  mirrors the pre-RabbitMQ behavior (the old code was fire-and-forget with
  no `await` at all) but is strictly safer — a genuine unhandled rejection
  is no longer possible.
- **What `eventPublisher.publish` actually does**
  (`rabbitmq-event-publisher.ts`): gets the shared channel
  (`getRabbitChannel()`) and calls
  `channel.publish(EVENTS_EXCHANGE, ROUTING_KEYS.NOTIFICATION_EMAIL_SEND, emailData, { persistent: true })`.
  `persistent: true` means the message survives a RabbitMQ restart (written
  to disk, not just held in memory). `EVENTS_EXCHANGE` and
  `ROUTING_KEYS.NOTIFICATION_EMAIL_SEND` are constants
  (`rabbitmq-topology.ts`, `constants/routing-keys.ts`) — no raw string
  literals at the call site.

### Step 4 — Topic exchange routes the message

- **File:** `rabbitmq-topology.ts`
- **Effect:** `starter.events` is a **topic** exchange. A topic exchange
  matches the message's routing key against every queue's binding
  pattern and delivers a copy to each match. Today `QUEUES.EMAIL_QUEUE`
  (`"email-queue"`) is bound to exactly one routing key,
  `ROUTING_KEYS.NOTIFICATION_EMAIL_SEND` (`"notification.email.send"`),
  declared in `QUEUE_BINDINGS`, so the message lands in `email-queue`.
- **Side-effect:** this binding is declared once, at process startup, by
  `assertEventsTopology()` — every process that calls `getRabbitChannel()`
  (the API server *and* every consumer) runs this setup, so the topology
  always exists regardless of which process starts first.

### Step 5 — `email-send-consumer.ts` picks it up

- **File:** `email-send-consumer.ts`
- **Actor:** a separate, always-running Node process (its own Docker
  container in `docker-compose.dev.yml` — `email-send-consumer`), not the
  API server.
- **Effect:** `ch.prefetch(10)` caps it to 10 unacknowledged messages at
  once, then `ch.consume(QUEUES.EMAIL_QUEUE, ...)` receives the message
  and calls `handleMessage(msg)`, which parses the JSON body back into an
  `EmailJob` and calls `sendEmailWithNodemailer` (production) or
  `sendEmailUsingMailhog` (development) — the actual SMTP call happens
  here, nowhere else. `WORKER_NAME` (used in every log line) comes from
  `WORKERS.EMAIL_SEND_CONSUMER`.

### Step 6a — Success path

- **Effect:** `ch.ack(msg)` — RabbitMQ permanently removes the message
  from `email-queue`. Done.

### Step 6b — Failure path: retry

- **Guard:** `xDeath.length < MAX_RETRY_COUNT` (10) — `xDeath` is
  RabbitMQ's own `x-death` header, which it appends automatically every
  time a message is dead-lettered. This is *not* a custom counter the app
  maintains.
- **Effect:** `ch.nack(msg, false, false)` — because `email-queue` is
  declared with `deadLetterExchange: "", deadLetterRoutingKey:
  "email-queue.retry"`, a nacked-without-requeue message is automatically
  routed to `email-queue.retry`. That queue has a 5-second TTL
  (`messageTtl: 5000`) and its own dead-letter config pointing back at
  `email-queue` — so after 5 seconds the message reappears in
  `email-queue`, redelivered, `x-death` length now one higher.

### Step 6c — Failure path: exhausted, terminal

- **Guard:** `xDeath.length >= MAX_RETRY_COUNT` (10)
- **Effect:** `ch.sendToQueue("email-queue.dlq", msg.content, { persistent: true, headers: msg.properties.headers })`
  followed by `ch.ack(msg)`. This is an **explicit publish**, not automatic
  — a queue's dead-letter configuration is static and can't branch
  "retry vs. terminal" per message, so the consumer has to make that call
  itself and manually route to the dead-letter queue, then ack the
  original so it isn't also picked up by the automatic retry path.
- **Result:** the message sits permanently in `email-queue.dlq`. A cron job
  (`dlqDepthCheckJob`, `cron-manager.service.ts`, every 5 minutes) polls
  every queue's DLQ depth via the RabbitMQ management HTTP API
  (`src/infrastructure/events/rabbitmq-management.ts`) and calls
  `logger.error` when it's non-zero — see Open Items for what alerting
  still needs to sit on top of that log line.

## Retry / Failure Semantics Summary

| Property                  | Value                                                              |
| -------------------------- | ------------------------------------------------------------------- |
| Delivery guarantee          | At-least-once — a message can be delivered more than once; the email-send consumer has no idempotency key, so a retried message re-sends the email |
| Max retry attempts          | 10 (`MAX_RETRY_COUNT`, `rabbitmq-topology.ts`)                     |
| Retry delay                 | Fixed 5s per attempt (`RETRY_TTL_MS`), not exponential backoff      |
| Retry counter source        | `x-death` header length (RabbitMQ-native), not an app-maintained counter |
| Concurrency                 | Up to 10 in-flight messages at once (`ch.prefetch(10)`)             |
| What happens if the consumer container is down | Messages simply queue up in `email-queue`, unprocessed, until the consumer reconnects — nothing is lost, delivery is just delayed |
| What happens if RabbitMQ itself is down when publishing | The `try/catch` in the controller catches it, logs an error, and the HTTP request still succeeds — the email is simply never sent for that request |

## Error Catalogue

| Failure                                            | Where                                    | Thrown / logged?                         | Effect on the HTTP request              |
| --------------------------------------------------- | ----------------------------------------- | ------------------------------------------ | ------------------------------------------ |
| RabbitMQ unreachable / publish rejects               | `signupController` (and every other producer) | Caught, `logger.error(...)` — not thrown  | None — request still returns `200`         |
| Email send throws (bad SMTP creds, Mailhog down, etc.) | `email-send-consumer.ts`'s `handleMessage` | Caught by the consumer's own try/catch      | None — this runs in a separate process, minutes after the original request already responded |
| Retries exhausted (10 attempts)                       | `email-send-consumer.ts`                  | Logged via `logger.error`, message moved to `email-queue.dlq` | None — silent from the requester's point of view; visible only by inspecting the DLQ |

## Design Rationale

- **Why a shared `eventPublisher` singleton instead of each file
  constructing its own publisher:** originally (Phase 4 of the RabbitMQ
  migration) each producer built its own `BullMqEventPublisher` /
  `RabbitMqEventPublisher` behind an env-var ternary, for a temporary
  dual-run comparison window against the old BullMQ path. Once BullMQ was
  fully decommissioned (Phase 6) and a second producer (email) needed the
  exact same publish call, that per-file construction stopped making
  sense — it's now one shared instance imported everywhere.
- **Why publish failures never fail the request:** email delivery has
  always been best-effort in this codebase (the pre-RabbitMQ code didn't
  even `await` the send). Making a queue outage block signup/password-reset
  would be a worse regression than an occasional missed email.
- **Why `x-death` instead of a custom retry-count header:** RabbitMQ
  doesn't auto-increment custom headers — an earlier draft of this
  pipeline tried a hand-rolled `x-retry-count` header and it silently
  never incremented, so every failure looked "not yet exhausted" forever.
  `x-death` is populated by RabbitMQ itself on every dead-letter hop, so
  there's nothing to forget to update.
- **Why the email-send consumer runs as a separate process/container, not
  inside the API server:** if sending were still done in-process, a burst
  of signups would compete with normal HTTP request handling for the same
  event loop. A dedicated consumer with a capped `prefetch` isolates that
  work and can be scaled independently later.

## Open Items

- **DLQ-depth alerting — partially closed.** `dlqDepthCheckJob` (registered
  in `cron-manager.service.ts`, every 5 minutes) now logs
  `logger.error("DLQ depth alert: ...")` for any queue in `QUEUE_BINDINGS`
  whose `.dlq` has messages. In staging/production this ships to Loki
  (`src/infrastructure/monitoring/logger.ts`), so it's no longer
  manual-inspection-only. What's still missing: an actual Grafana alert
  rule on that log line — the cron job produces the signal, it doesn't
  page anyone yet. That's an infra/dashboard config change, not a code
  change.
- **Email payload shape — closed.** `EmailJob`
  (`src/infrastructure/events/email-job.types.ts`) is now the single
  shared type for the `{to, from, subject, html, text}` shape. Every
  producer annotates its constructed payload as `EmailJob` before
  publishing, and `email-send-consumer.ts` imports the same type instead
  of a local duplicate — a field rename now fails at compile time instead
  of silently at runtime.
- No idempotency key on email jobs — a redelivered message (retry path)
  resends the same email. Still an accepted trade-off, not a gap: email-send
  has no meaningful "already done" state to check against, so there is
  nothing cheaper to add.

## Related Documents

| Document                                                        | Path                                                                 |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Topology source                                                   | `src/infrastructure/events/rabbitmq-topology.ts`                        |
| Shared publisher                                                  | `src/infrastructure/events/event-publisher.ts`                          |
| RabbitMQ publisher implementation                                 | `src/infrastructure/events/rabbitmq-event-publisher.ts`                 |
| This flow's consumer                                              | `src/workers/email-send-consumer.ts`                                    |
| Queue / worker / routing-key constants                            | `src/constants/queues.ts`, `src/constants/workers.ts`, `src/constants/routing-keys.ts` |
| Shared email payload type                                         | `src/infrastructure/events/email-job.types.ts`                          |
| DLQ depth polling helper + cron                                   | `src/infrastructure/events/rabbitmq-management.ts`, `src/modules/cron-jobs/services/cron-manager.service.ts` |
| Every current producer of `ROUTING_KEYS.NOTIFICATION_EMAIL_SEND`  | `sign-up.controller.ts`, `forgot-password.controller.ts`, `resend-email-verification.controller.ts`, `google-signin-controller.ts`, `linkedin-signin-controller.ts` |

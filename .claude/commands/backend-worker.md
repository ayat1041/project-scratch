---
description: Add or change an async job in apps/backend — queue, routing key, publisher, and worker consumer, with idempotency and retry handling.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Backend Queue and Worker (B9)

## Step 1 — Confirm async is warranted

Async is right when the work is slow, external, retryable, or must not block the response — email, ingestion, external sync, extraction. It is wrong when the caller needs the result, or when the only motivation is that the endpoint feels slow. Say which applies before continuing.

## Step 2 — Gather inputs

- What triggers the job, and from which feature service
- Job payload fields
- Is it idempotent by nature, or does the handler have to make it so?
- What happens after `MAX_RETRY_COUNT` — which failure state gets recorded?
- Can an existing queue carry this, or is a new one needed?

## Step 3 — Required reading

- Skill `backend-workers`
- `src/constants/queues.ts`, `routing-keys.ts`, `workers.ts`
- `src/infrastructure/events/rabbitmq-topology.ts`
- The closest existing consumer — `email-send-consumer.ts` is the reference for the queue/consumer shape

## Step 4 — Reuse a queue before adding one

Queue names are a durable wire contract. Check whether an existing queue already carries this concept — `EMAIL_QUEUE` deliberately serves several notification types (signup, password-reset, email verification). Adding a near-duplicate queue splits the consumer fleet for no gain.

**Never rename an existing queue or routing key.** A rename orphans in-flight messages. If one is genuinely required, plan it as a migration — drain the old queue, run both consumers, retire the old name — and say so explicitly rather than editing the constant.

## Step 5 — Define the contract — all three pieces

Messaging here is a **topic exchange** (`starter.events`), not direct queue sends. A job needs three wired pieces:

1. Routing key in `ROUTING_KEYS`, dotted lowercase — `"user.api-key.created"`
2. Queue name in `QUEUES`, kebab-case, **named for the concept, not the current provider**
3. A `QUEUE_BINDINGS` entry in `src/infrastructure/events/rabbitmq-topology.ts` joining them:

```typescript
{ queue: QUEUES.MY_QUEUE, routingKeys: [ROUTING_KEYS.MY_EVENT] },
```

**A routing key with no binding publishes successfully into the void** — no error, no consumer, no trace. This is the step most easily missed.

Also: worker name in `WORKERS`, and a job payload type next to the producing feature (`types/<feature>-lifecycle.types.ts`), imported by both publisher and consumer so they cannot drift.

## Step 6 — Publish

From the feature service, through `eventPublisher`, **after** the transaction commits:

```typescript
import { eventPublisher } from "@/infrastructure/events/event-publisher";
import { ROUTING_KEYS } from "@/constants/routing-keys";

const result = await db.transaction(async (tx) => { /* writes */ });
await eventPublisher.publish(ROUTING_KEYS.MY_EVENT, job);   // after commit — never inside
```

`publish(routingKey, payload, opts?)` sends with `persistent: true`; `opts.messageId` is available for de-duplication.

Two checks:

- **Never `channel.sendToQueue` from a service** — it bypasses the exchange and silently misses any queue later bound to that key. The only legitimate `sendToQueue` is a consumer moving a poisoned message to its own `.dlq`.
- A publish inside a transaction survives a rollback, and the consumer then processes a job for a row that does not exist.

## Step 7 — Write the consumer

`src/workers/<name>-consumer.ts`:

```typescript
import "module-alias/register";   // MUST be the first line
import "dotenv/config";

const QUEUE_NAME = QUEUES.MY_QUEUE;
const WORKER_NAME = WORKERS.MY_CONSUMER;

const handleMessage = async (msg: ConsumeMessage): Promise<void> => {
  const job = JSON.parse(msg.content.toString()) as MyQueueJob;
  // 1. re-read current state — no-op if already done
  // 2. do the work
  // 3. record the resulting state
};
```

Requirements:

- **Idempotent.** Re-read state and no-op when the work is already done; a message can be delivered twice.
- Explicit state transitions (`markAsSent` / `markAsFailed`), not blind updates.
- Honour `MAX_RETRY_COUNT`. Past it, record the failure state and stop — an infinite requeue is worse than a recorded failure.
- Ack **after** the work is durably recorded. Nack-with-requeue for transient failures; without requeue once retries are exhausted.
- Log with `WORKER_NAME` so a failure traces to a process.
- Share logic with the feature through `src/workers/shared/` — never import a controller.

## Step 8 — Register the process

Add **both** scripts to `apps/backend/package.json`:

```json
"my-consumer:dev": "NODE_OPTIONS='--max-old-space-size=4096' tsx watch --clear-screen=false src/workers/my-consumer.ts",
"my-consumer": "node --max-old-space-size=4096 dist/workers/my-consumer.js"
```

Then add it wherever consumers are actually launched (compose file / process manager). A consumer that exists only in `src/` never runs in production — check and report this explicitly.

## Step 9 — Test

- Handler runs twice on the same message → one effect
- Retry exhaustion records the failure state
- Malformed payload does not poison-loop

```bash
pnpm --filter backend test:services
pnpm --filter backend build
```

## Step 10 — Report

- Routing key, queue, **`QUEUE_BINDINGS` entry**, worker name, job type.
- Where the publish happens, that it goes through `eventPublisher`, and that it is after commit.
- How idempotency is achieved.
- Retry-exhaustion behaviour.
- Scripts added, and whether the consumer is wired into the production launch path.

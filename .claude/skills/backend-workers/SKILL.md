---
name: backend-workers
description: Layer B9 — RabbitMQ queues, routing keys, and worker consumers in apps/backend/src/workers. Use when publishing a job, adding a consumer, changing a queue name, or handling retries and dead letters. Covers durable-name stability, idempotency, and the publish-after-commit rule.
---

# B9 — Queues and Workers

Asynchronous work runs through RabbitMQ as a **topic exchange**, not direct queue sends. A service publishes a *routing key* to the exchange; the topology binds routing keys to queues; a standalone consumer process drains each queue.

```
exchange: "starter.events"  (topic, durable)   ← EVENTS_EXCHANGE

src/constants/queues.ts        QUEUES        durable queue names
src/constants/routing-keys.ts  ROUTING_KEYS  topic routing keys
src/constants/workers.ts       WORKERS       worker process names
src/infrastructure/events/
  event-publisher.ts           eventPublisher — the ONLY publish entry point
  rabbitmq-topology.ts         EVENTS_EXCHANGE, QUEUE_BINDINGS, assertEventsTopology, MAX_RETRY_COUNT
  rabbitmq-connection.ts       getRabbitChannel
  safe-channel-ops.ts          safeChannelOp — wraps ack/nack/sendToQueue
src/workers/<name>-consumer.ts one process per queue
src/workers/shared/            handlers shared between a consumer and its feature
```

Current consumers: `email-send`. A new async job (e.g. `api-key-revoke`) adds its own queue, routing key, and consumer alongside it.

A new async job therefore needs **three** things wired, not one: a routing key, a queue, and a `QUEUE_BINDINGS` entry joining them. A routing key with no binding publishes successfully into the void.

## Durable names are a wire contract

```typescript
export const QUEUES = {
  EMAIL_QUEUE: "email-queue",
  IDENTITY_PROVIDER_SYNC_QUEUE: "identity-provider-sync-queue",   // named for the concept, not the provider
};
```

**Renaming a queue orphans the old one** — messages already sitting in it are never consumed again. Name queues for the concept, not the current provider (`identity-provider-sync-queue` deliberately serves Google and LinkedIn sign-in alike). If a rename is genuinely required, it is a migration: drain the old queue, run both consumers, then retire the old name. Never a one-line edit.

The same applies to `ROUTING_KEYS`. Both files are referenced by running processes that may be mid-deploy.

## Publishing

Publish from a **feature service**, through `eventPublisher`, after any transaction has committed:

```typescript
import { eventPublisher } from "@/infrastructure/events/event-publisher";
import { ROUTING_KEYS } from "@/constants/routing-keys";

const result = await db.transaction(async (tx) => { /* writes */ });
await eventPublisher.publish(ROUTING_KEYS.NOTIFICATION_EMAIL_SEND, job);   // after commit
```

`publish(routingKey, payload, opts?)` sends to `EVENTS_EXCHANGE` with `persistent: true`; `opts.messageId` is available for de-duplication. **Publish by routing key — never `channel.sendToQueue` from a service.** Direct sends bypass the topology and silently miss any additional queue later bound to that key. The only legitimate `sendToQueue` is a consumer moving a poisoned message to its own `.dlq`.

A publish inside a transaction survives a rollback: the consumer then processes a job for a row that does not exist. This is the single most common bug in this layer.

Job payloads are typed. Define the type next to the feature that produces it (`types/email-notification.types.ts`) and import it in the consumer, so producer and consumer cannot drift.

## Consumer shape

```typescript
import "module-alias/register";   // must be first
import "dotenv/config";

const QUEUE_NAME = QUEUES.EMAIL_QUEUE;
const WORKER_NAME = WORKERS.EMAIL_SEND_CONSUMER;

const handleMessage = async (msg: ConsumeMessage): Promise<void> => {
  const job = JSON.parse(msg.content.toString()) as EmailJob;
  // ...
};
```

- `import "module-alias/register"` is the **first** line — `@/` paths do not resolve without it in a standalone process.
- A consumer is its own entry point with its own `dev` and production script in `package.json`. Adding a consumer means adding both.
- Consumers share business logic with the feature through `src/workers/shared/`, not by importing a controller.

## Idempotency and retries

A message can be delivered more than once. Every handler must be safe to run twice.

- Re-read current state before acting (`fetchCurrentStatus`) and no-op when the work is already done.
- Drive state through explicit transitions (`markApiKeyAsRevoked`, `markApiKeyAsRevokeFailed`) rather than blind updates.
- Respect `MAX_RETRY_COUNT` from `rabbitmq-topology`. Past it, move the message to its failure state and stop — an infinite requeue loop is worse than a recorded failure.
- Ack only after the work is durably recorded. Nack with requeue for a transient failure; without requeue once retries are exhausted.
- Log with the worker name so a failure is traceable to a process.

## Local runs

```bash
pnpm --filter backend email-send-consumer:dev
pnpm --filter backend api-key-revoke-consumer:dev
```

Production entry points are the non-`:dev` scripts, running the compiled `dist/workers/*.js`. A new consumer needs both scripts plus whatever process manager or compose file runs it — a consumer that exists only in `src/` never runs in production.

## Anti-patterns

| Anti-pattern | Why it breaks | Correct |
|---|---|---|
| Queue or routing key renamed in place | Orphans in-flight messages | Treat as a migration |
| `channel.sendToQueue` from a service | Bypasses the topic exchange and its bindings | `eventPublisher.publish(ROUTING_KEYS.X, payload)` |
| New routing key with no `QUEUE_BINDINGS` entry | Publishes into the void — no error | Bind it in `rabbitmq-topology.ts` |
| Publish inside a transaction | Job survives a rollback | Publish after commit |
| Handler not idempotent | Duplicate delivery double-processes | Re-read state, no-op when done |
| Retrying forever | Poison message loops | Honour `MAX_RETRY_COUNT`, then record failure |
| Ack before the work is durable | Silent message loss | Ack after |
| `module-alias/register` missing or not first | `@/` imports fail at runtime only | First line |
| Consumer importing a controller | Drags in HTTP concerns | Share via `workers/shared/` |
| Untyped `JSON.parse` payload | Producer/consumer drift | Shared job type |
| New consumer with no production script | Never runs outside dev | Add both scripts |

## Checklist

- [ ] Queue and routing key added to `constants/queues.ts` / `routing-keys.ts`, named for the concept
- [ ] `QUEUE_BINDINGS` entry in `rabbitmq-topology.ts` joins the routing key to its queue
- [ ] Published via `eventPublisher.publish(ROUTING_KEYS.X, payload)`, not `sendToQueue`
- [ ] No existing durable name renamed
- [ ] Job payload has a shared type used by producer and consumer
- [ ] Publish happens after the transaction commits
- [ ] Handler is idempotent and re-reads state before acting
- [ ] `MAX_RETRY_COUNT` respected with an explicit failure state
- [ ] Ack after durable write; nack semantics correct
- [ ] `module-alias/register` first line
- [ ] Both `:dev` and production scripts registered
- [ ] `pnpm --filter backend build` passes

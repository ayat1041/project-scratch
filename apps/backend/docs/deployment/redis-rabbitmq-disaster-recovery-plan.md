# Redis & RabbitMQ Disaster Recovery Plan

### Companion to the Infrastructure Roadmap — protecting the memory and the mailroom

PREPARED FOR: Engineering & Leadership
STATUS: PROPOSED, NOT YET BUILT
COMPANION TO: _Infrastructure Roadmap — For Starter Leadership_; _Backup & Disaster Recovery Strategy (PostgreSQL)_

---

## 01 — Why this isn't the same problem as the database

The PostgreSQL plan was built around one hard fact: the ledger holds records that can never be reconstructed if lost, so that plan is entirely about **not losing data**. Redis and RabbitMQ don't share that fact — but they don't share _each other's_ risk profile either, so they need two different plans, not one copy-pasted approach.

- **Redis** holds the "short-term memory" — cache data. If it vanishes, nothing precious is destroyed forever: the cache rebuilds itself from the database as requests come back in. Session tokens are stored and checked in PostgreSQL, not Redis, so a Redis outage doesn't log anyone out — the real risk here is **slower responses while the cache re-warms**, not permanent loss or forced logouts.
- **RabbitMQ** holds real business events waiting to happen — "send this welcome email," "send this password reset." If a message in the mailroom is lost, that real-world action silently never happens, and unlike a logged-out user, nobody notices to retry it. The risk here is much closer to PostgreSQL's: **losing something that can't be recreated**.

So: Redis gets a plan focused on _staying available_. RabbitMQ gets a plan focused on _never silently dropping a message_ — closer in spirit to the database plan.

---

## 02 — Redis: keeping the front desk's memory intact

> **Analogy:** if the person holding the restaurant's short-term memory suddenly forgets everything, nothing is really lost — every regular's actual account is on record in the ledger (the database), not this notepad. Service is just briefly slower while the notepad restocks itself with everyone's usual order (the cache re-warms).

**The plan, in two parts:**

```
              ┌────────────────────┐
              │   Redis primary      │  ← serves cache reads/writes
              └─────────┬─────────────┘
                        │ replicates continuously
                        ▼
              ┌────────────────────┐
              │   Redis replica      │  ← kept in sync, ready to take over
              └────────────────────┘

              ┌────────────────────┐
              │  Sentinel  ×3          │  ← watches both, promotes the replica
              └────────────────────┘        automatically if the primary dies
```

**Part A — Replication + Sentinel (automatic failover).**
A second Redis server stays continuously synced with the primary. Three lightweight **Sentinel** processes — light enough to run alongside services we already have, not new servers — constantly check whether the primary is actually reachable. If a majority of them agree it's down, they promote the replica automatically and redirect the App servers to it, with no one paged in the middle of the night to do it by hand. This is a step more automatic than the PostgreSQL standby, where promotion is a deliberate manual action — Redis's own tooling handles the decision for us.

**Part B — Persistence (AOF).**
Even with a replica, a _total_ restart (both machines down, or a clean redeploy) would otherwise come back completely empty. Redis's **Append Only File (AOF)** logs every write to disk as it happens — the same idea as PostgreSQL's WAL — so a restarted instance reloads its actual last-known state instead of starting from zero. Configured with an "every second" fsync policy, this caps potential loss at roughly one second of writes, which is more than adequate for cache data.

**What this doesn't fully remove:** failover typically takes on the order of 10–30 seconds — the brief window Sentinel needs to detect the failure and agree on a new primary — during which cache reads may briefly fall back to the database. And because replication is asynchronous, the last fraction of a second of writes right before a crash could theoretically be lost. For cache data, that's an acceptable trade — it would not be acceptable for the database, which is exactly why PostgreSQL's plan is stricter.

---

## 03 — RabbitMQ: making sure a ticket in the mailroom never disappears

> **Analogy:** a slow front desk is an inconvenience — regulars wait a moment longer. A mailroom that vanishes with unopened tickets still inside it is worse: those signups and emails never happen, and there's no queue of annoyed customers to alert anyone that something's missing.

**The plan, in two parts — durability first, then real fault tolerance:**

**Part A — Durability (do this regardless of budget).**
Three settings, all inexpensive to enable:

- **Durable queues** — the queue definition itself survives a broker restart.
- **Persistent messages** — each message is marked to be written to disk immediately, not just held in memory.
- **Publisher confirms** — the App server waits for RabbitMQ to confirm a message was actually accepted and written before treating "the welcome email is queued" as true. **Consumer acknowledgements** do the same on the other end: a worker only tells RabbitMQ "done" after it finishes processing, so a worker that crashes mid-task gets its message redelivered instead of losing it.

This alone means a single-node restart — a crash, a redeploy — doesn't drop anything sitting in a queue at the time.

**Part B — A 3-node cluster with quorum queues (real fault tolerance).**

```
        ┌────────────┐     ┌────────────┐     ┌────────────┐
        │ RabbitMQ     │◀───▶│ RabbitMQ     │◀───▶│ RabbitMQ     │
        │ node 1        │     │ node 2        │     │ node 3        │
        └────────────┘     └────────────┘     └────────────┘
          every quorum queue is replicated across all three nodes;
          losing any ONE node keeps every queue fully intact and available
```

**Quorum queues** are RabbitMQ's modern replicated queue type (the successor to the older "classic mirrored queues," which are being phased out). Each queue's contents are replicated across the cluster using the **Raft consensus** algorithm — the same family of technique used by many distributed databases to keep replicas in agreement. The trade-off to know going in: Raft needs a _majority_ of nodes to keep operating, which is why the minimum useful cluster size is **three** nodes (tolerating one failure), not two. This is a real infrastructure step up from Redis's single extra replica, not a small tweak.

Everything already in the roadmap's design — the dead-letter queue and retry ladder — keeps working exactly as designed, now with the added guarantee that a node failure mid-flight doesn't silently take a message down with it.

**If budget is tight right now:** Part A alone (durability + confirms + acks) is real, meaningful protection on its own and costs nothing extra to run — it's the difference between "a crash loses messages" and "a crash doesn't." Part B is what additionally survives losing an entire server, not just a restart. Treating Part A as immediate and Part B as the next intermediate-stage upgrade is a reasonable way to sequence this, similar to how the roadmap itself sequences the move to AWS.

---

## 04 — How this fits what we already have

| Existing tool             | Its job in this plan                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Terraform**             | Provisions the Redis replica and, if adopted, the two additional RabbitMQ nodes                                 |
| **Ansible**               | Configures Sentinel, Redis persistence, and RabbitMQ clustering — same tool already managing every other server |
| **GitHub Actions**        | Runs the failover drills below on a schedule                                                                    |
| **Grafana Cloud + Alloy** | New alerts: Sentinel failover events, Redis replication lag, RabbitMQ node/quorum health, queue depth           |

---

## 05 — Proving it works: the failover drills

**Redis drill:** in a staging environment, stop the primary and confirm (a) Sentinel promotes the replica within the target window, and (b) the App reconnects on its own without a deploy or manual step.

**RabbitMQ drill:** stop one cluster node and confirm queues stay fully available and messages keep flowing through the remaining two; confirm the dead-letter/retry path is unaffected; then restart the node and confirm it rejoins and catches up cleanly.

Run both monthly, log pass/fail and timing to Grafana — the same discipline as the PostgreSQL restore drill, so "it's resilient" stays a tested fact rather than an assumption.

---

## 06 — What it costs

| Item                                         | Rough monthly cost | Notes                                                                             |
| -------------------------------------------- | ------------------ | --------------------------------------------------------------------------------- |
| Redis replica (1 server)                     | ~$10–15            | Sentinel processes run alongside existing services — effectively free             |
| RabbitMQ durability settings (Part A)        | $0                 | Configuration only, no new infrastructure                                         |
| RabbitMQ 2 additional cluster nodes (Part B) | ~$20–30            | The larger addition — 3 nodes total is the minimum for real fault tolerance       |
| **Total added cost (full plan)**             | **~$30–45/month**  | On top of the PostgreSQL plan and the roadmap's existing intermediate-stage total |

---

## 07 — Technical reference

| Term                          | What it is                                                           | Why it matters here                                                               |
| ----------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Sentinel**                  | Redis's built-in monitoring and automatic-failover system            | Detects a dead primary and promotes the replica without manual action             |
| **AOF (Append Only File)**    | Redis's write-by-write log to disk                                   | Lets Redis reload real data after a full restart instead of coming up empty       |
| **RDB**                       | Redis's periodic full-snapshot format                                | Faster to restore from than AOF but coarser-grained; often used together with AOF |
| **Quorum queue**              | RabbitMQ's modern replicated queue type                              | What actually survives a full node failure, not just a restart                    |
| **Raft consensus**            | The algorithm quorum queues use to keep replicas in agreement        | Explains why 3 nodes (a majority-capable number) is the practical minimum         |
| **Durable queue**             | A queue definition that survives a broker restart                    | Baseline protection with no clustering required                                   |
| **Persistent delivery mode**  | A message flagged to be written to disk, not just kept in memory     | Protects individual messages across a restart                                     |
| **Publisher confirms**        | RabbitMQ's acknowledgement to the sender that a message was accepted | Closes the gap between "we tried to send it" and "it's actually safe"             |
| **Consumer acknowledgements** | A worker's signal that it finished processing a message              | Ensures a crashed worker's message gets redelivered, not lost                     |

---

## Open items for engineering to confirm

- Sequencing: ship RabbitMQ Part A (durability) immediately regardless of budget; schedule Part B (3-node cluster) as an intermediate-stage follow-up
- Target failover times for both systems, to be confirmed by the first round of drills
- Alert thresholds for Grafana (replication lag, queue depth, node health)

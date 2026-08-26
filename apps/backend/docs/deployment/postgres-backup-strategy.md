# Backup & Disaster Recovery Strategy

### Companion to the Infrastructure Roadmap — how we protect the ledger

PREPARED FOR: Engineering & Leadership
STATUS: PROPOSED, NOT YET BUILT
COMPANION TO: _Infrastructure Roadmap — For Starter Leadership_

---

## 01 — The two questions this plan answers

Every backup strategy is really just an answer to two questions, and they pull against each other:

- **How much data can we afford to lose** if something goes wrong? Engineers call this the **RPO** — Recovery Point Objective.
- **How long can we afford to be down** while we fix it? Engineers call this the **RTO** — Recovery Time Objective.

A single nightly backup gives a weak answer to both: you could lose up to a full day of data, and recovering means someone noticing the outage, provisioning a new server by hand, and restoring the backup onto it — which can take hours. This plan replaces that with two pieces working together, so both numbers become small and known instead of one vague promise of "we have backups."

> **Analogy:** think of the database — the "ledger" from the roadmap — as the business's account book. This plan keeps two different kinds of copies of it: one that captures _every new entry the instant it's written_, and one that's a _live second copy_, always up to date and ready to take over the moment the first one is unavailable.

---

## 02 — The plan, in one picture

```
                    ┌─────────────────────────┐
                    │   PostgreSQL primary     │   ← the ledger, actively in use
                    └────────────┬──────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                                ▼
   ┌───────────────────────┐         ┌───────────────────────────┐
   │  PART A — Continuous    │         │  PART B — Warm standby     │
   │  off-site backup        │         │  replica                   │
   │  (protects against      │         │  (protects against         │
   │   losing data at all)   │         │   being down a long time)  │
   └───────────────────────┘         └───────────────────────────┘
```

Two independent pieces, each solving a different problem:

| Piece                        | Question it answers            | What it protects against                                           |
| ---------------------------- | ------------------------------ | ------------------------------------------------------------------ |
| **A — Continuous backup**    | _How much data could we lose?_ | Corruption, accidental deletion, a bad write, a full-site disaster |
| **B — Warm standby replica** | _How long would we be down?_   | The primary server itself failing or becoming unreachable          |

Neither one alone is enough. A standby copies bad data just as faithfully as good data — it doesn't protect against corruption. A backup alone means real downtime while you rebuild — it doesn't protect against outage length. Together, they cover both failure modes.

---

## 03 — Part A: Continuous off-site backup

**In plain English:** instead of taking one photocopy of the ledger at midnight and hoping nothing important happens before the next one, we keep a running copy that updates itself the moment any new entry is written — and we store that copy somewhere physically separate from the ledger itself, so a fire, flood, or outage at the main office can't destroy both at once.

**In technical terms:** PostgreSQL keeps an internal, ordered log of every change it makes, called the **Write-Ahead Log (WAL)**. A backup agent ships that log to storage continuously, alongside periodic full snapshots (**base backups**). This is called **WAL archiving**, and it's what shrinks the data-loss window from "up to a day" down to "a few seconds."

```
 Postgres primary
      │  writes to the Write-Ahead Log (WAL) continuously
      ▼
 Backup agent (pgBackRest or WAL-G)
      │  ships nightly base backups + every WAL segment as it's produced
      ▼
 Off-site object storage
 (different provider than Hetzner — e.g. Backblaze B2 or AWS S3)
```

- **Base backup** — a full snapshot taken on a schedule (e.g. nightly). Think of it as the "start of a fresh photocopy."
- **WAL archiving** — every subsequent change ships as it happens, like adding pages to that photocopy in real time rather than waiting for tomorrow's copy.
- **Point-in-time recovery (PITR)** — because we have the base backup _and_ the stream of changes since, we can restore the database to any exact moment — including "one minute before the bad thing happened," not just "as of last night."
- **Why a different storage provider than Hetzner:** if the backup lived with the same provider as the live database, a single provider-wide incident could take out both the ledger and its safety copy at once. Storing it elsewhere (e.g. Backblaze B2, AWS S3) is what actually satisfies the standard **3-2-1 rule**: 3 copies of the data, on 2 different types of storage, with 1 copy kept geographically and organizationally separate.

---

## 04 — Part B: Warm standby replica

**In plain English:** having a backup is like having a spare key locked in a safe across town — it will get you back in, but it takes time to go retrieve it. A standby replica is more like having a second, fully trained clerk sitting right next to the first one, watching and copying every entry as it's made, ready to pick up the ledger and keep working the instant the first clerk has to step away.

**In technical terms:** a second small PostgreSQL server, kept continuously synced with the primary through **streaming replication**, running in **hot standby** mode (readable and instantly promotable). On a private network, replication lag is typically sub-second.

```
 Postgres primary ──── streaming replication ────▶ Postgres standby
 (accepts writes)         (near-real-time sync)      (same private network,
                                                        separate server)

 If the primary fails:
   1. Promote the standby to primary
   2. Re-point the App servers at it
   3. Done — minutes, not hours
```

This is the specific gap flagged earlier in the roadmap review: today's design doubles the App servers but runs a single copy of PostgreSQL, Redis, and RabbitMQ. A standby replica is the cheapest, smallest step that closes that gap for the database specifically — one more modest server, not a full high-availability cluster.

---

## 05 — How this fits what we already have

Nothing here introduces a new category of tool — it extends the toolchain already named in the roadmap's technical reference:

| Existing tool             | Its new job in this plan                                                                                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Terraform**             | Provisions the standby server and the off-site storage bucket/credentials                                                                                                   |
| **Ansible**               | Installs and configures the backup agent and replication — the same tool already managing today's one server                                                                |
| **GitHub Actions**        | Runs the scheduled restore drill (see §06)                                                                                                                                  |
| **Grafana Cloud + Alloy** | Gets new alerts: WAL archiving lag, replication lag, and backup job failures — this is what turns "backed up continuously" into a _monitored fact_ instead of an assumption |

---

## 06 — Proving it works: the monthly restore drill

An untested backup is not a verified backup — it's a belief. This closes that gap directly:

1. **Spin up** a throwaway server via Terraform.
2. **Restore** the latest base backup, replaying WAL up to a chosen point in time.
3. **Validate** the restored copy — row counts and checksums against the live database.
4. **Record** the restore time and pass/fail result to Grafana; alert if it fails or takes longer than the target RTO.
5. **Tear down** the throwaway server.

Run this monthly to start. Over time, this loop turns "we believe our backups work" into a real, board-reportable number — and catches a silently broken backup long before an actual emergency does.

---

## 07 — What it costs

| Item                    | Rough monthly cost                   | Notes                                                          |
| ----------------------- | ------------------------------------ | -------------------------------------------------------------- |
| Warm standby server     | ~$10–20                              | One more small Hetzner instance, same tier as existing servers |
| Off-site backup storage | Usage-based, typically a few dollars | Scales with database size, not fixed                           |
| **Total added cost**    | **~$15–25/month**                    | On top of the intermediate-stage total already in the roadmap  |

No new tool categories, no new vendor relationships beyond an off-site storage bucket — everything else is already in the stack.

---

## 08 — Technical reference

| Term                               | What it is                                                                | Why it matters here                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **RPO** (Recovery Point Objective) | The maximum data you can afford to lose, measured in time                 | The target this whole plan is designed around — continuous WAL archiving brings it down to seconds |
| **RTO** (Recovery Time Objective)  | The maximum time you can afford to be down                                | The standby replica is what brings this down to minutes instead of hours                           |
| **WAL** (Write-Ahead Log)          | PostgreSQL's internal, ordered record of every change                     | The raw material continuous backup is built from                                                   |
| **WAL archiving**                  | Continuously shipping WAL segments to storage as they're created          | What separates "seconds of data loss" from "a full day"                                            |
| **Base backup**                    | A complete snapshot of the database at one point in time                  | The starting point every restore replays forward from                                              |
| **Point-in-time recovery (PITR)**  | Restoring the database to any specific moment, not just the last snapshot | Lets us recover to "just before the bad thing happened"                                            |
| **pgBackRest / WAL-G**             | Mature, open-source backup agents for PostgreSQL                          | Handle compression, encryption, and shipping to S3-compatible storage out of the box               |
| **Streaming replication**          | Continuous, near-real-time copying of the database to a second server     | The mechanism behind the warm standby                                                              |
| **Hot standby**                    | A replica that's kept ready and can be promoted to primary quickly        | What makes failover a matter of minutes                                                            |
| **3-2-1 rule**                     | 3 copies of data, on 2 storage types, with 1 copy off-site                | The standard this plan is built to satisfy                                                         |

---

## A note on scope

This document covers **PostgreSQL specifically** — the one piece of the stack holding data that can never be reconstructed. Redis and RabbitMQ have their own resilience questions (raised separately in the roadmap review) and are intentionally out of scope here; they're cheaper to protect but solve a different problem — availability, not data loss.

## Open items for engineering to confirm

- Final choice of backup agent: pgBackRest vs. WAL-G
- Off-site storage provider: Backblaze B2 vs. AWS S3 vs. another option
- Target RPO / RTO numbers to commit to, once the first restore drill produces a real baseline
- Cadence of the restore drill going forward (monthly to start — revisit after a few clean runs)

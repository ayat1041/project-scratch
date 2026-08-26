# Scalable Infra — Planning Summary (Pre-Final)

Status: Draft / decisions log, not an execution plan yet.

This doc exists because the conversation that produced it spans application
architecture (queue/fan-out), deployment tooling (Terraform/Ansible/Swarm),
edge services (Cloudflare), and provider/topology sizing (Hetzner) — none of
which belongs hand-tuned into any single doc until the provider and topology
are actually locked in.

## 1. Where this came from

Starting point: current backend runs RabbitMQ with dedicated worker
processes/containers (see [`rabbitmq-email-flow-runtime.md`](./rabbitmq-email-flow-runtime.md)
for the application-layer shape), on one VPS, no fan-out beyond the existing
topic exchange, no load balancer. This doc covers everything *around* that —
how it actually gets deployed and scaled.

## 2. Application architecture decisions

- Target: RabbitMQ topic exchange as the fan-out point (SNS-equivalent),
  durable per-concern queues with DLX/retry-ladder, decoupled worker
  processes, nginx/LB in front of N stateless API instances.
- Rejected AWS SNS/SQS/Lambda as the primary path — this isn't an
  AWS-committed shop (self-hosted Postgres/Redis, VPS-based, DNS on
  Cloudflare). RabbitMQ + persistent worker containers is the
  industry-standard fit for this traffic shape (steady transactional
  fan-out: email/in-app/push notifications) — not bursty enough to justify
  Lambda, not high-throughput/event-sourcing enough to justify Kafka.
- Clarified during discussion: a "worker" in this design is a long-running
  consumer process, not a Lambda-equivalent. True FaaS parity only exists if
  fully committing to SNS→SQS→Lambda-trigger instead of RabbitMQ+workers.

## 3. Provisioning + config-management layering

- `infra/ansible/` today is config-management only — no provisioning layer.
  `inventory/hosts.yml` is one static, hand-written host
  (`starter`, 153.92.214.212). Postgres/Redis/app all run as Docker
  containers on that single box, tied together by one bridge network
  (`starter-dev-app-network`) with a `network_alias` — that alias trick only
  works because everything is on one host; it breaks the moment hosts split.
- Decision: add Terraform as the provisioning layer (creates/destroys
  servers, network, firewalls). Ansible keeps doing what it does — configures
  whatever Terraform created, via a generated/dynamic inventory instead of
  the static file.
- App-layer orchestration decision: **Docker Swarm** across the fleet — not
  a hand-rolled SSH-loop-per-host in `deploy-dev.yml`, not full Kubernetes.
  Swarm's overlay network solves the cross-host service-discovery problem
  (replaces the broken single-host `network_alias` pattern), gives rolling
  updates (`docker service update --image`) and replica placement
  (`--replicas N` constrained by node labels) for free, using the Docker
  Engine already running everywhere. Revisit k8s only once node count/ops
  burden actually justifies the added complexity — not needed at this scale.
- `deploy-dev.yml` today: builds one image, pushes to Docker Hub, SSHes into
  the single `REMOTE_HOST`, runs `docker run` directly per app. Once on
  Swarm, this collapses to: build+push image (unchanged) → SSH into the
  Swarm manager only → `docker stack deploy --with-registry-auth -c
  docker-stack.yml starter`.

## 4. Cloudflare (DNS + R2 already in use)

- **Edge security layer** (pairs with the fleet going multi-server/publicly
  reachable): enable proxy (orange-cloud) on DNS records for CDN+DDoS
  protection at the edge, WAF managed rules, rate limiting rules on
  auth endpoints (offloads what `express-rate-limit` does in-app),
  Turnstile on signup forms (bot-resistant, privacy-friendly,
  free — the signup flow is a natural abuse target).
- **Zero-exposure admin/internal access**: Cloudflare Tunnel (`cloudflared`)
  for SSH and the RabbitMQ management UI (15672) instead of IP-allowlisting
  at the firewall — zero public inbound ports on those droplets at all.
  Cloudflare Access in front of `apps/admin` as an extra identity layer on
  top of whatever auth the admin panel already does.
- **Frontend hosting (Cloudflare Pages via `@opennextjs/cloudflare`)** —
  **explicitly deferred by decision, not part of this infra plan.** Revisit
  when frontend hosting is decided separately.
- **Cloudflare Images** — only relevant if the product has image-heavy
  media (user-uploaded profile photos or attachments, not confirmed). Open
  item, see §8.

## 5. Provider decision: Hetzner Cloud

- Chosen over DigitalOcean for cost. Hetzner has an official, actively
  maintained Terraform provider (`hetznercloud/hcloud`) — the provisioning
  plan from §3 applies to Hetzner exactly as it would to DO.
- Hetzner-native pieces to use directly instead of self-hosting/hand-rolling
  equivalents:
  - **Cloud Load Balancer** (managed) — replaces the need to self-host and
    hand-tune nginx as the LB. Solves the "nginx resolves upstream hostname
    once at startup" dynamic-backend problem flagged in the main migration
    doc's §8.2 (Hetzner LB natively health-checks and updates its target
    pool as servers are added/removed — no `resolver`/variable-`proxy_pass`
    workaround needed). This is the actual traffic-distribution layer —
    **not** Cloudflare's separate Load Balancing product. Cloudflare's LB
    operates at DNS/edge level, health-checking origins over the public
    internet across origin pools; using it here instead would require
    giving the app droplets public IPs, undoing the private-network-only
    posture below, for a multi-region/multi-provider failover capability
    this single-region MVP doesn't need yet. Cloudflare's role stays proxy/
    edge only (§4) — DNS orange-cloud, WAF, Turnstile, Universal SSL — in
    front of this Hetzner LB's public IP, not in place of it.
  - **Private Networks** (free) — internal-only traffic between app/db/
    redis/rabbitmq/worker nodes, nothing but the LB and SSH publicly
    reachable.
  - **Cloud Firewalls** (free, per-server rule sets) — same posture as the
    current Ansible `firewall_allowed_ports`/`firewall_deny_ports` pattern
    in `host_vars/starter.yml`, just enforced per-node-role instead of via
    one host's local rules.
  - **Volumes** — separate persistent block storage for the DB node, so data
    survives a server rebuild/resize independent of the root disk.
  - **Automated server backups** (~20% of server cost/mo) — snapshot-level
    safety net on top of application-level backup strategy (§7).

## 6. TLS / Certificate Strategy

Splits into two hops given the §4 decision to proxy through Cloudflare
(orange-cloud):

- **Edge (browser ↔ Cloudflare)**: Cloudflare Universal SSL. Free, automatic,
  zero maintenance, issued the moment DNS is proxied — no setup beyond the
  proxy decision already made in §4.
- **Origin (Cloudflare ↔ Hetzner LB)**: **Cloudflare Origin CA certificate**,
  not Let's Encrypt. Free, up to 15-year validity, purpose-built for this
  exact pairing — only trusted by Cloudflare (not public browsers), which is
  fine since only Cloudflare talks to origin once proxied. Install once on
  the Hetzner Load Balancer (Hetzner LB supports uploading a custom cert for
  TLS termination directly — no nginx needed for this, consistent with §5's
  decision to use Hetzner's managed LB instead of self-hosted nginx). Set
  Cloudflare's SSL mode to **Full (strict)** — encrypts and validates
  edge→origin too; avoid "Flexible" mode, which leaves that hop unencrypted.
- **Skip Let's Encrypt at origin.** It solves a problem this setup doesn't
  have (public trust at the origin) and adds an unnecessary moving part
  (90-day renewal automation) versus Origin CA's free 15-year cert built for
  exactly this topology.
- **Exception**: anything that deliberately bypasses Cloudflare proxy
  (grey-cloud) needs its own publicly-trusted cert, since Origin CA certs
  aren't browser-trusted. If that ever comes up, use Hetzner LB's built-in
  Let's-Encrypt-backed managed certificate feature (auto-renews on Hetzner's
  side) rather than hand-rolling certbot/acme.sh. Not expected to apply —
  everything public-facing in this plan (app traffic, admin, RabbitMQ mgmt
  UI, SSH) is already routed through Cloudflare proxy or Tunnel per §4.
- Additionally: lock the Hetzner Cloud Firewall on the LB to only accept
  inbound from Cloudflare's published IP ranges — belt-and-suspenders on top
  of Origin CA already not being publicly trusted.

## 7. Minimum disaster-recovery-minded MVP topology

Framing: cheapest plan that still survives a single-node failure per
component, without paying for HA machinery the traffic doesn't justify yet.

| Component | Count | Why this count | DR posture at this tier | Upgrade trigger |
|---|---|---|---|---|
| Load Balancer | 1 (Hetzner managed) | Not a droplet — Hetzner's LB service is itself redundant/SLA-backed; no benefit to running 2 | Provider-managed uptime | N/A — managed service |
| App (Express) | 2 | Minimum to survive one instance crashing without full outage; stateless, so scaling to 3+ later is just adding LB targets | Requests fail over to the surviving instance automatically via LB health checks | Add more once sustained CPU/latency, not "just in case" |
| Postgres (DB) | 1 + backups | A DR-active standby (streaming replica + failover) is real ops overhead (Patroni/pg_auto_failover) — premature before there's paying-customer/SLA pressure | Automated Hetzner server backups + continuous WAL/base-backup shipped to **Cloudflare R2** (S3-compatible, already in use — via `pgbackrest` or `wal-g`) for point-in-time recovery. Restore-from-backup on failure, not instant failover — accept some downtime at this tier. | Add a streaming standby once uptime SLA or traffic makes restore-time downtime unacceptable |
| Redis | 1 | Redis is not on the queue critical path (RabbitMQ owns job durability); it backs sessions/cache/rate-limiting only, so losing it is recoverable | `appendonly yes` (AOF persistence) so a restart doesn't lose data; Hetzner automated backup | Add a replica (Sentinel) only if Redis remains a hard dependency (e.g. sessions) at higher traffic |
| RabbitMQ | 1 | A 3-node quorum-queue cluster is real DR but is overkill pre-revenue; single-node with durable queues is the pragmatic MVP floor | Durable queues + Volume-backed persistence + automated backup. On node failure: publishers already degrade gracefully — the publish call is wrapped in try/catch and logs the reason instead of the API crashing (existing code path, not new). Processing pauses until the node is back, no message loss for durable/persisted messages already on disk. | Move to a 3-node quorum cluster once message loss becomes an unacceptable business risk, not before |
| Worker | 1 (2 optional) | Stateless and safe to restart — the consumer acks only after its work succeeds (at-least-once delivery), and messages stay queued in RabbitMQ (not lost) if the worker node is down | A single worker delays processing, doesn't lose it, on failure | Add a 2nd worker node if processing *throughput* uptime matters, not for correctness |

Minimum node count: **6 droplets** (2 app + 1 db + 1 redis + 1 rabbitmq +
1 worker) + 1 managed LB. All on one Hetzner Private Network; only the LB
(and SSH, ideally behind a Cloudflare Tunnel per §4) publicly reachable.

## 8. Cost estimate — Hetzner Cost-Optimized (CX) line

Pulled from Hetzner's live Cost-Optimized product line and docs (not the
Regular Performance or dedicated General Purpose lines). Reflects pricing
after Hetzner's 2026 adjustments (April 1 and June 15) where confirmed —
verify at checkout before committing, LB pricing in particular may have
moved again since; this is a planning estimate, not a quote.

| Node | Plan | Specs | €/mo |
|---|---|---|---|
| App ×2 | CX23 | 2 vCPU, 4 GB RAM, 40 GB NVMe, 20TB traffic incl. | €5.49 each = €10.98 |
| Worker ×1 | CX23 | 2 vCPU, 4 GB RAM, 40 GB | €5.49 |
| Redis ×1 | CX23 | 2 vCPU, 4 GB RAM, 40 GB | €5.49 |
| RabbitMQ ×1 | CX33 | 4 vCPU, 8 GB RAM, 80 GB | €8.49 |
| Postgres (DB) ×1 | CX33 | 4 vCPU, 8 GB RAM, 80 GB | €8.49 |
| DB Volume (persistent, 40GB) | — | block storage, €0.0572/GB/mo | €2.29 |
| Load Balancer | LB11 | up to 25 services, 10,000 connections, TLS termination incl. | €7.49 |
| Automated backups (DB + RabbitMQ only) | — | 20% of instance price, up to 7 retained | €3.40 |
| **Hetzner subtotal** | | | **~€52.12/mo (~$57-58)** |

Sizing logic: app/worker/redis stay on CX23 (light MVP load); RabbitMQ and
Postgres bumped to CX33 for RAM headroom (queue buffering, connection pool
room) — those two matter most under load. Backups scoped to DB+RabbitMQ
only (the stateful/durable-data nodes), not all 6 droplets, consistent with
§7's "backup-only, not full HA" MVP philosophy — extending backups to every
droplet adds ~€4.39/mo more (20% of the full €38.94 droplet total instead
of just the two).

**Cost-avoidance worth calling out**: skip public IPv4 on the 5 internal
droplets (app/worker/redis/rabbitmq/db) — use IPv6-only + Private Network,
since none of them need to be publicly reachable per §5's "only the LB is
public" design anyway. Only the LB needs a public IP (bundled in its
price). This sidesteps Hetzner's separate IPv4 surcharge (~$2.40/mo per
extra IP per recent pricing) on nodes that shouldn't be internet-facing
regardless.

**Non-Hetzner costs, still free-tier-dominated**: Cloudflare $0 (Free plan
covers proxy/WAF/Turnstile/Universal SSL/Tunnel/Access — §4, §6), R2 ~$1-10
/mo usage-based (no egress fee), Grafana Cloud $0 free tier (§10), external
uptime checker $0 free tier (§10).

**Total: ~$58-68/mo at MVP.** Realistic ceiling once past pure-MVP
(Cloudflare Pro, Grafana paid tier if free-tier limits are hit, higher R2
usage): **~$95-115/mo.**

## 10. Observability & monitoring: managed, not self-hosted

Checked the actual code before deciding — this isn't greenfield. Already in
place and correctly built, transport-agnostic:

- `src/infrastructure/monitoring/tracing.ts` — full OTel `NodeSDK` with
  auto-instrumentation, exporting traces via OTLP HTTP to a
  `MONITORING_HOST_IP`-based endpoint (currently pointed at a self-hosted
  Tempo target).
- `src/infrastructure/monitoring/prometheus-custom-metrics.ts` +
  `app.ts:83-100` — `prom-client` histograms/counters (HTTP duration/count/
  active-requests), exposed at `/metrics`, correctly restricted to internal
  network only.
- `docker-compose.dev.yml` has prometheus/node-exporter/cadvisor/grafana/
  loki/tempo/postgres-exporter services — all **commented out**. The
  self-hosted LGTM (Loki/Grafana/Tempo/Mimir-Prometheus) stack was started,
  then paused.

**Decision: go managed for the storage/query/alerting backend
(Grafana Cloud specifically), keep the instrumentation above unchanged.**
This is the one deliberate break from the self-host-everything-else pattern
used for Postgres/Redis/RabbitMQ (§7) — and for a specific reason: alerting
cannot live on the infra it's watching. If Prometheus/Alertmanager/Grafana
run on your own droplet and that droplet or its network path goes down, the
outage that most needs an alert is exactly the one that produces none — the
"who watches the watchmen" problem. A small team also can't reliably run
Prometheus + Loki + Tempo (each needing its own retention/storage sizing,
Loki/Tempo needing object storage backends at real scale) + Alertmanager
routing on top of everything else already decided in this doc.

**Why Grafana Cloud over Datadog/New Relic/Axiom**: it's the same
Prometheus/Loki/Tempo/Grafana stack already half-built here — same PromQL/
LogQL, same OTLP and Prometheus remote-write wire protocols the app already
speaks. Migration is a config swap, not a rewrite:

- `tracing.ts`: change the exporter URL from `monitoringHostIP:4318` to
  Grafana Cloud's OTLP endpoint, add the auth header. Few lines, one file.
- `/metrics`: unchanged. Run **Grafana Alloy** (one agent binary, successor
  to node-exporter+promtail+otel-collector combined) per node instead of
  self-hosted Prometheus — scrapes `/metrics` locally, tails container logs,
  remote-writes both to Grafana Cloud. Deploy as a Docker Swarm **global
  service** (§3) — one replica per node automatically — or via the same
  Ansible role pattern as everything else.
- Drop the commented-out prometheus/loki/tempo/grafana/postgres-exporter/
  node-exporter/cadvisor blocks from `docker-compose.dev.yml` entirely —
  Alloy replaces all of them.
- Datadog/New Relic do more (full APM suites) but their per-host+per-GB
  pricing tends to surprise-bill at MVP stage; Axiom is logs/traces-first
  with a weaker alerting/dashboard story. Grafana Cloud's free tier (check
  current limits — they move, but generous on metrics series/log GB/trace GB
  at 14-day retention) very likely covers MVP traffic.

**Alerts to wire immediately, tied to decisions already made elsewhere in
this doc:**

- RabbitMQ **DLQ depth > 0** — `dlqDepthCheckJob` already logs this every 5
  minutes (see [`rabbitmq-email-flow-runtime.md`](./rabbitmq-email-flow-runtime.md)
  Open Items); this closes the loop with an actual Grafana alert rule on
  that log line instead of manual inspection.
- API 5xx rate over a 5-min window — free, already instrumented via
  `totalRequests{status_code}`, zero new code.
- Postgres/Redis/RabbitMQ node unreachable or disk >80%.
- Hetzner LB reporting 0 healthy backends.
- Worker consume-failure rate — instrument the RabbitMQ consumer directly.

Route all of it to one Slack channel for now — no PagerDuty/Opsgenie
on-call routing needed until there's an actual rotation to route to.

**Optional add-on**: a cheap external uptime checker (Better Stack Uptime or
UptimeRobot, both free-tier) as a check living *outside* the Cloudflare/
Hetzner/Grafana Cloud footprint entirely — catches the scenario where
everything above is also down.

## 11. Industry-standard / funding-readiness gap analysis

Prompted by: founder pursuing funding, so the deployment stack needs to read
as scalable and flexible under technical diligence, not just work at MVP
traffic. Verdict: the architectural shape (§1-§10) is genuinely
industry-standard for seed stage — event-driven fan-out, IaC, managed
observability+alerting, edge security, and DR tiers with named upgrade
triggers rather than hand-waved redundancy. That last pattern is itself a
positive diligence signal — "here's exactly what breaks and exactly when we
fix it" reads better than pretending everything is HA from day one. Real
gaps below, prioritized.

1. **Single region, no DR-region story** — the biggest gap for a
   "scalable" narrative. Fix: add an explicit upgrade trigger, same pattern
   as §7's table — e.g. "first enterprise customer requiring uptime SLA →
   Postgres streaming replica in a second Hetzner region."
2. **No autoscaling** — the 2 app instances in §7 are a fixed count, not an
   elastic pool; VM+Swarm doesn't scale on load automatically. Fix: either
   a cron/webhook script watching Grafana Cloud metrics that calls the
   Hetzner API to add a droplet, or at minimum a documented manual runbook
   (Terraform apply to add a node, ~2 min) — a documented manual path beats
   no path.
3. **Terraform state isn't addressed anywhere in §3.** Uncontrolled local
   `terraform.tfstate` holds secrets in plaintext with no locking, no
   recovery if lost. Fix: remote state with locking — the existing R2
   bucket (S3-compatible) plus a lock table, or Terraform Cloud's free
   tier. Cheap, should land in §3 before folding into the final doc.
4. **Secrets management is `.env` files + Ansible Vault.** Fine for a
   2-3 person team, a common technical-DD flag past that — no rotation
   policy, no access audit trail. Not urgent; flag with its own trigger
   ("before first outside engineer joins" or "before a SOC2 conversation
   starts") so it reads as tracked, not overlooked.
5. **Self-hosted Postgres/Redis/RabbitMQ is the right latency/cost call
   (§7's own reasoning) but carries a compliance-narrative cost** —
   enterprise customers asking for SOC2/HIPAA-type assurances push more
   audit burden onto self-hosted stateful services vs. inheriting a managed
   vendor's compliance report. Not a fix-now item — name the trigger
   explicitly: "SOC2 Type II required by a customer" → revisit managed DB.
6. **PII/data-protection specifics aren't addressed.** This platform
   stores real names/emails (user records, activity logs).
   Hetzner being EU-based helps the GDPR story, but nothing here covers
   encryption at rest on the Postgres volume, log redaction (do emails end
   up unredacted in Grafana Cloud via request logging?), or a stated
   data-retention policy. Concrete, checkable, worth a real pass.
7. **"We have backups" without "we've tested restoring them."** Add a
   recurring (quarterly is fine now) restore-drill to §7's DR posture —
   restore the R2-shipped WAL backup to a scratch instance, confirm it
   comes up clean.
8. **No rollback/canary strategy on deploy.** Once on Swarm (§3),
   `docker service update --update-failure-action rollback` gated on a
   healthcheck is cheap to wire and isn't in the plan yet. Currently the
   fallback is "SSH in and fix it" — fine at 2 nodes, won't read well in a
   "how do you ship safely" conversation.
9. **Staging isn't mapped onto the new topology.** Staging exists today
   (`stagingapi.example.com` in the current Ansible vars) but this entire
   doc has been written prod-only. Needs its own smaller/cheaper
   Terraform-provisioned shape, not an afterthought.
10. **No dependency/image vulnerability scanning in CI.** `pnpm audit`/
    Dependabot/Snyk for the app, image scanning (Trivy or similar) for the
    Docker images going into Swarm — not mentioned anywhere in the
    pipeline. Common, cheap, a common DD ask.

**What's already right, don't second-guess these**: RabbitMQ fan-out over
Lambda/Kafka (§2), portable IaC not locked to Hetzner-proprietary tooling,
Swarm over premature k8s, Grafana Cloud avoiding the self-hosted
"who watches the watchmen" trap (§10), the Cloudflare edge security stack
(§4), the TLS pairing (§6), and the DR-tiering-with-named-triggers pattern
throughout §7.

## 12. Open items before this becomes the final migration plan section

- Confirm Hetzner region (latency to actual user base — matters more than
  cost at the margin).
- Confirm whether Redis needs to remain a hard dependency (sessions? cache?)
  at higher traffic, and whether it needs its own DR tier beyond §7's plan.
- Confirm whether the product has image/media-heavy features (user-uploaded
  photos or attachments) — decides whether Cloudflare Images is worth adding
  now.
- Frontend hosting decision — deferred, not blocking this backend/infra plan.
- DB DR tier decision: backup-only (this doc's recommendation for MVP) vs.
  streaming-replica-with-failover — recommend deciding the upgrade trigger
  explicitly (e.g. "first paying customer" or "uptime SLA signed") rather
  than leaving it open-ended.
- Once the above are answered: turn §3, §5, §6, §7, §10 into a standalone
  infra-provisioning doc, written in the same step-by-step format as this
  one.

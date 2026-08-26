# Memory Leak Prevention Guide — Express & Next.js

A practical checklist beyond the four common categories (event listeners & timers, closures, uncontrolled `Map`/`Set`, detached DOM). Grouped by where leaks actually originate.

---

## Part 1 — Express / Node.js Backend

### 1. Streams & I/O

Streams are the #1 silent leak source in Node servers.

- **Always end streams.** Every `Readable`/`Writable` you open must be closed — pipe with `pipeline()` (from `node:stream`) instead of `.pipe()`. `pipeline` propagates errors and destroys all streams on failure.
- **Destroy on client disconnect.** If a client aborts (`req.on('close')`) mid-download, destroy your upstream source (DB cursor, S3 stream, file read) — otherwise it stays open consuming memory and a socket.
- **Never buffer entire uploads into memory.** Use streaming multipart parsers (busboy, formidable with `fileWriteStreamHandler`) — not the default `multer.memoryStorage()` for large files.
- **Cap `highWaterMark`** for large file streams; don't accumulate chunks into a single `Buffer.concat([])` for files you could stream.

### 2. Database connections

- **Use a single pool per process**, not per request. `new Pool()` inside a controller is a textbook leak.
- **Release every connection.** Wrap `pool.connect()` / `client.query()` in `try/finally` with `client.release()`. With Drizzle's `pool` you usually don't touch this, but raw `pool.connect()` calls do.
- **Close cursors.** Server-side cursors (`pg-cursor`, Mongo `find().stream()`) must be `.close()`'d in a `finally`.
- **Bound query results.** Add `LIMIT`/pagination on every list query. An unbounded `SELECT *` that returns 2M rows will OOM the process before the GC can react.

### 3. Async/await & promise lifecycle

- **Never store unresolved promises on long-lived objects.** A pending promise keeps its `.then` callbacks (and their closures) alive forever.
- **Always `await` or `.catch()` background work.** A floating rejected promise can keep references via the unhandled-rejection handler. Use `void` only for true fire-and-forget, and add a `.catch(log)`.
- **Cancel in-flight work on shutdown.** Pass an `AbortSignal` through long-running handlers; abort during `gracefulShutdown`.

### 4. Request/response scope

- **Don't attach app-scoped data to `req` or `res`.** Anything you put on `req` lives until the response ends — that's normally fine, but if you attach a giant cache, parsed file, or array of DB rows you no longer need, drop the reference before any awaits.
- **Strip large payloads after use.** `req.body = null` (or just stop referencing it) before kicking off background jobs that capture `req` in their closure.
- **Limit body size globally.** `express.json({ limit: '1mb' })` and equivalent for `urlencoded`/`raw`. Without limits, a single malicious POST can exhaust memory.

### 5. Caching

- **Bound every in-memory cache.** Use `lru-cache` with `max` and `ttl`. Never use a plain `Map` as a cache.
- **Prefer Redis** for anything that isn't trivially small or per-request memoized. Redis evicts; your `Map` doesn't.
- **Invalidate by event, not by hope.** A cache without an invalidation strategy is a leak with a long fuse.
- **Per-request memoization belongs on `res.locals`** — it dies with the response. App-level memoization needs an LRU.

### 6. EventEmitters

- **Set a max listener count explicitly** (`emitter.setMaxListeners(N)`). The default 10-listener warning often hides a real accumulation bug.
- **Use `.once()`** when you only need a single firing.
- **Remove listeners on teardown.** For dynamic subscribers (sockets, child processes, BullMQ workers respawned in a loop), pair every `.on()` with `.off()`/`.removeListener()` in the teardown path.
- **Avoid module-level `process.on('uncaughtException', ...)` registered multiple times** (e.g. during hot reload in tests). One registration per process.

### 7. Workers, queues, cron

- **Singleton workers/queues** at module scope — never `new Worker()` per request.
- **`await worker.close()`** on `SIGTERM`. BullMQ holds Redis connections and in-flight job state otherwise.
- **Stop cron jobs on shutdown.**
- **Drain BullMQ queues with `removeOnComplete`/`removeOnFail` set** so Redis doesn't grow unboundedly.

### 8. Logging & observability

- **Don't log full objects unconditionally.** Winston/Pino serializers retain the object until the transport flushes; under high load with a slow transport (file/Loki) this becomes a real backpressure-driven leak.
- **Set log transport buffer limits.** Winston's `File` transport with a slow disk + `maxsize` unset will queue indefinitely.
- **OpenTelemetry**: cap span attribute size, use `BatchSpanProcessor` (not `SimpleSpanProcessor`) so spans flush and are released.
- **Prometheus**: never use unbounded label cardinality (`user_id` as a label is a leak — every user creates a new time series held in memory forever).

### 9. Module-level state

- **Module top-level `let`/`const` that grows is a leak by definition.** `const visitors: string[] = []` then `push` per request — classic.
- **Singletons that hold references to per-request data** (e.g. a singleton that caches the last request body for "debugging") leak everything.

### 10. Native code / bindings

- **`Buffer.allocUnsafe`** without zeroing leaks data (security) but the buffer itself is GC'd normally. Just be aware.
- **Sharp / image libs**: dispose the pipeline (`.destroy()` or just let it complete). Concurrent unbounded sharp jobs OOM fast — gate with a queue.
- **Database drivers in native mode** (e.g. better-sqlite3 prepared statements) must be `.finalize()`'d if created dynamically.

### 11. HTTP clients

- **Reuse a single `axios`/`undici` agent** with a connection pool. `new Axios()` per request leaks sockets.
- **Set timeouts on every outbound request.** A hung outbound call holds the request, its closure, and a socket indefinitely.
- **Abort with `AbortController`** on client disconnect.

### 12. Tests

- **Close the DB pool in `after`.**
- **Tear down servers** (`server.close()`), workers, and intervals at the end of each test file. Otherwise `node:test`/Jest hangs and reports false-positive "leaked handles."
- **Use `--detect-open-handles`** (Jest) or check `process._getActiveHandles()` length in CI to catch regressions.

---

## Part 2 — Next.js / React Frontend

### 1. Effects, listeners, timers

- **Every `setTimeout`/`setInterval`/`addEventListener`/`subscribe` inside `useEffect` needs a cleanup return.** No exceptions.
- **Move countdowns and timers OUT of event handlers and into effects** keyed on the state that drives them.
- **`ResizeObserver`/`IntersectionObserver`/`MutationObserver`** — call `.disconnect()` in the cleanup, not just `.unobserve()`.
- **`AbortController`**: create one per effect, abort in cleanup. Pass `signal` to `fetch`/axios. This prevents both leaks AND the "setState on unmounted component" warning.

### 2. Fetching & caching

- **Don't store responses in module-level variables.** A `let cachedUser: User | null = null` at the top of `auth-client.ts` survives navigation forever and across user sessions in the same tab.
- **Use React Query / SWR with bounded `gcTime`.** Don't set `gcTime: Infinity` (or `cacheTime: Infinity` in old versions).
- **Cancel in-flight fetches** on route change with `AbortController` to free the closure capturing the component.
- **Don't keep WebSocket connections open in `useEffect` without cleanup.** Always `socket.close()` in the return.

### 3. State management

- **Redux/Zustand stores live for the whole tab.** Don't dump 50MB of API data into them "just in case." Normalize and prune.
- **Selectors that return new references every call** (e.g. `state => state.items.filter(...)`) re-create derived arrays and keep old ones around through memoization. Use `reselect` or stable selectors.
- **Avoid storing DOM nodes in Redux/Context.** Refs go in `useRef`, never in global state.

### 4. Refs

- **Clear refs on unmount** when they hold large objects: `return () => { bigRef.current = null }`.
- **Don't store class instances, charts, maps (Leaflet/Mapbox), or media players in refs without explicit `.destroy()` / `.dispose()` in cleanup.** These libraries allocate native resources and DOM that React doesn't know about.

### 5. Context

- **Don't put rapidly-changing or large values in context.** Every subscriber holds a reference and re-renders on every change, retaining intermediate objects until GC.
- **Split contexts** (one for "auth user," one for "preferences"). A single mega-context keeps everything alive in every consumer.

### 6. Third-party UI libraries

These commonly leak if you don't clean up:

- **Chart.js / Recharts / D3** — call `chart.destroy()` in effect cleanup.
- **Mapbox / Leaflet** — `map.remove()`.
- **Video.js / HLS.js** — `player.dispose()` / `hls.destroy()`.
- **Monaco / CodeMirror** — `editor.dispose()`.
- **Socket.io / Pusher** — `client.disconnect()`.
- **Drag-and-drop libs** — many attach window listeners; check their docs.

### 7. Next.js specific

- **Server Components don't leak client memory** — they render and discard. Push heavy data fetching to RSC where possible.
- **Don't put global state in Server Components.** Module-level state on the server is shared across requests AND users — that's a leak AND a security issue.
- **`useRouter().events`** (Pages Router) — unsubscribe in cleanup. App Router has no `events` API; you're safe by default.
- **Dynamic imports with `ssr: false`** that re-import on every render — memoize or hoist. Each call can register module-level side effects.
- **Image component**: don't pass freshly-generated `src` URLs (e.g. `Date.now()`-cache-busted) — they defeat caching and accumulate decoded image memory.
- **`next/script` with `strategy="lazyOnload"`** for analytics that you don't need on every page; otherwise their listeners attach everywhere.

### 8. Forms

- **React Hook Form / Formik** usually fine, but `watch()` subscriptions live for component lifetime — heavy forms in long-lived modals can retain entire form state. Unmount the modal completely (don't just `display: none`).

### 9. Browser APIs that allocate

- **`URL.createObjectURL`** — every call must be paired with `URL.revokeObjectURL` (file previews, image uploads). Otherwise the Blob stays in memory until the tab closes.
- **`new Worker()`** — call `.terminate()` in cleanup.
- **`navigator.mediaDevices.getUserMedia`** streams — stop all tracks (`stream.getTracks().forEach(t => t.stop())`).
- **`canvas` contexts**: large offscreen canvases hold GPU and CPU memory; nullify refs.

### 10. Long-lived tabs

Next.js SPAs often run for hours. Things that don't leak per-navigation can still leak per-hour:

- **Polling intervals** without bounds (`setInterval` every 5s that calls a paginated API and appends to state). Cap retained data.
- **Notification subscriptions** (Server-Sent Events, WebSockets) — close them on tab hidden if you don't need real-time, reopen on visible.
- **Analytics queues** that buffer events without flushing.

---

## Cross-cutting practices

### Detection

- **Backend**: `node --inspect` + Chrome DevTools Memory tab → take 3 heap snapshots (steady state, after load, after load + GC). Compare retained sizes. Tools: `clinic.js heapprofiler`, `0x` for flame graphs.
- **Frontend**: Chrome DevTools → Performance Monitor (watch JS heap + DOM nodes + listeners over time). Take heap snapshots before/after repeated navigation between the same two routes — heap size should return to baseline.
- **CI guards**: `--detect-open-handles` in Jest; a smoke test that boots the server, makes 10k requests, and asserts RSS growth stays under a threshold.

### Architecture rules of thumb

1. **Bound everything that grows.** Caches, queues, logs, retries, listeners.
2. **Own the teardown.** If you create it, you destroy it — in `finally`, `useEffect` return, or shutdown hook.
3. **Pass `AbortSignal` down.** Both Node and browser support it; it's the universal cancellation primitive.
4. **Singleton at module scope, scope per request.** Never the inverse.
5. **Prefer streaming over buffering.** For files, DB results, and API responses larger than ~1MB.
6. **Don't trust GC to save you from architectural mistakes** — closures over large objects survive as long as the reference chain holds.

### Red flags in code review

- `let cache = {}` at module top of a frontend service file
- `setInterval` without a captured handle
- `req.on('data', ...)` without `req.on('end' | 'close' | 'error')`
- `new Pool()`, `new Worker()`, `new EventEmitter()` inside a function called per request
- `useEffect(() => { window.addEventListener(...) }, [])` with no return
- `useRef<Chart>()` or `useRef<Map>()` (the library, not JS Map) without a cleanup effect
- `JSON.parse(JSON.stringify(hugeObject))` to "clone" — doubles peak memory
- `array.push` inside an unbounded `setInterval`/event handler
- Any cache without a TTL or max size

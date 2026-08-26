# Monitoring & Observability System

## Overview

This monorepo implements a comprehensive, multi-layered monitoring system across both the **frontend** and **admin** applications using **Grafana Faro** for client-side observability and **OpenTelemetry** for server-side tracing. This document provides a complete walkthrough of the monitoring architecture, configuration, and usage.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Client-Side Monitoring (Grafana Faro)](#client-side-monitoring-grafana-faro)
3. [Server-Side Tracing (OpenTelemetry)](#server-side-tracing-opentelemetry)
4. [Source Map Management](#source-map-management)
5. [Configuration Guide](#configuration-guide)
6. [Error Handling & Recovery](#error-handling--recovery)
7. [Production Best Practices](#production-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client-Side)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Grafana Faro Web SDK                         │   │
│  │  • Console logs capture                              │   │
│  │  • Error tracking                                    │   │
│  │  • Web Vitals (Performance metrics)                  │   │
│  │  • User sessions                                     │   │
│  │  • Custom events                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ▼                                  │
│                  Faro Collector Endpoint                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Server (Server-Side)               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │         OpenTelemetry (@vercel/otel)                 │   │
│  │  • API request tracing                               │   │
│  │  • Server-side error tracking                        │   │
│  │  • Database query monitoring                         │   │
│  │  • Performance spans                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ▼                                  │
│              OTLP Exporter (Vercel/Custom)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Grafana Cloud Stack                       │
│  • Grafana (Visualization)                                   │
│  • Loki (Logs)                                              │
│  • Tempo (Traces)                                           │
│  • Mimir (Metrics)                                          │
└─────────────────────────────────────────────────────────────┘
```

### Applications

**1. Frontend App (`apps/frontend`)** - Public-facing application
- Service Name: `starter-frontend`
- Faro App: `starter-frontend`
- Port: `3000` (default)

**2. Admin App (`apps/admin`)** - Internal admin dashboard
- Service Name: `starter-admin`
- Faro App: `starter-admin`
- Port: `4000`

---

## Client-Side Monitoring (Grafana Faro)

### What is Grafana Faro?

Grafana Faro is a Real User Monitoring (RUM) solution that captures client-side telemetry data including:
- JavaScript errors and exceptions
- Console logs (info, warn, error)
- Web Vitals (LCP, FID, CLS, TTFB)
- User sessions and page views
- Network requests
- Custom events and measurements

### Implementation

#### 1. Shared Utility Component

Location: [`packages/utilities/src/observability/frontend-observability.tsx`](packages/utilities/src/observability/frontend-observability.tsx)

```tsx
"use client";

import {
  faro,
  getWebInstrumentations,
  initializeFaro,
  LogLevel,
} from "@grafana/faro-web-sdk";

interface FaroConfig {
  url?: string;
  appName: string;
  namespace?: string;
  version?: string;
  environment?: string;
}

export default function FrontendObservability({
  config,
}: {
  config?: Partial<FaroConfig>;
}) {
  // Prevent double initialization
  if (faro.api) {
    return null;
  }

  // Get Faro collector URL from environment
  const faroUrl = config?.url || process.env.NEXT_PUBLIC_FARO_URL;

  if (!faroUrl) {
    console.warn(
      "Faro URL not configured, skipping observability initialization",
    );
    return null;
  }

  try {
    initializeFaro({
      url: faroUrl,
      app: {
        name: config?.appName || process.env.NEXT_PUBLIC_FARO_APP_NAME || "app",
        namespace: config?.namespace || process.env.NEXT_PUBLIC_FARO_APP_NAMESPACE,
        version: config?.version || process.env.NEXT_PUBLIC_FARO_APP_VERSION || "1.0.0",
        environment: config?.environment || process.env.NEXT_PUBLIC_FARO_ENVIRONMENT || "development",
      },
      instrumentations: [
        ...getWebInstrumentations({
          captureConsole: true,
          captureConsoleDisabledLevels: [LogLevel.DEBUG, LogLevel.TRACE],
        }),
      ],
    });
  } catch {
    return null;
  }
  return null;
}
```

**Key Features:**

1. **Singleton Pattern**: Checks `faro.api` to prevent multiple initializations
2. **Environment-Based Config**: Falls back to environment variables if props not provided
3. **Graceful Degradation**: Silently fails if URL not configured (useful for local development)
4. **Console Capture**: Captures `info`, `warn`, `error` logs (excludes `debug` and `trace`)
5. **Client-Only**: Marked with `"use client"` directive for Next.js

#### 2. Integration in Applications

**Frontend App** ([`apps/frontend/app/layout.tsx`](apps/frontend/app/layout.tsx)):

```tsx
import dynamic from 'next/dynamic';

// Dynamically import with SSR disabled
const FrontendObservability = dynamic(
  () => import('@repo/utilities/observability/frontend-observability'),
  { ssr: false }
);

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Initialize Faro as early as possible */}
        <FrontendObservability />
        {children}
      </body>
    </html>
  );
}
```

**Admin App** ([`apps/admin/app/layout.tsx`](apps/admin/app/layout.tsx)):

```tsx
import dynamic from 'next/dynamic';

const FrontendObservability = dynamic(
  () => import('@repo/utilities/observability/frontend-observability'),
  { ssr: false }
);

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <FrontendObservability />
        {children}
      </body>
    </html>
  );
}
```

**Why Dynamic Import with `ssr: false`?**
- Faro relies on browser APIs (window, navigator, etc.)
- Prevents server-side errors during SSR
- Ensures initialization happens only in the browser

### What Gets Captured?

#### 1. **Automatic Error Tracking**

```tsx
// This error will be automatically sent to Grafana
function BuggyComponent() {
  throw new Error("Something went wrong!");
}

// Unhandled promise rejections are also caught
async function fetchData() {
  throw new Error("API request failed");
}
```

#### 2. **Console Logs**

```tsx
console.log("User logged in", { userId: 123 }); // Captured
console.warn("API rate limit approaching"); // Captured
console.error("Payment processing failed"); // Captured
console.debug("Debug info"); // NOT captured (filtered out)
```

#### 3. **Web Vitals**

Automatically collected performance metrics:
- **LCP (Largest Contentful Paint)**: Loading performance
- **FID (First Input Delay)**: Interactivity
- **CLS (Cumulative Layout Shift)**: Visual stability
- **TTFB (Time to First Byte)**: Server response time

#### 4. **User Sessions**

Each user gets a unique session ID, allowing you to:
- Track user journeys
- Replay error sequences
- Analyze behavior patterns

#### 5. **Network Requests**

HTTP requests are monitored for:
- Response times
- Status codes
- Failed requests
- API endpoint performance

---

## Server-Side Tracing (OpenTelemetry)

### What is OpenTelemetry?

OpenTelemetry (OTel) is an observability framework for creating and managing **traces** and **spans**. A trace represents a request's journey through your system, while spans represent individual operations within that trace.

### Implementation

#### Instrumentation File

**Frontend** ([`apps/frontend/instrumentation.ts`](apps/frontend/instrumentation.ts)):

```ts
import { registerOTel } from '@vercel/otel';

export function register() {
  console.log('🔍 [Instrumentation] OpenTelemetry initializing for starter-frontend...');

  registerOTel({
    serviceName: 'starter-frontend',
  });

  console.log('✅ [Instrumentation] OpenTelemetry registered successfully');
}
```

**Admin** ([`apps/admin/instrumentation.ts`](apps/admin/instrumentation.ts)):

```ts
import { registerOTel } from '@vercel/otel';

export function register() {
  console.log('🔍 [Instrumentation] OpenTelemetry initializing for starter-admin...');

  registerOTel({
    serviceName: 'starter-admin',
  });

  console.log('✅ [Instrumentation] OpenTelemetry registered successfully');
}
```

### How It Works

Next.js automatically calls the `register()` function when the application starts. This happens **before** any request handling, ensuring all traces are captured.

### What Gets Traced?

#### 1. **API Routes**

```ts
// app/api/users/route.ts
export async function GET(request: Request) {
  // This entire function execution becomes a span
  const users = await db.query('SELECT * FROM users');
  return Response.json(users);
}
```

**Resulting Trace:**
```
GET /api/users (150ms)
  ├─ Database Query: SELECT * FROM users (120ms)
  └─ Response Serialization (30ms)
```

#### 2. **Server Components**

```tsx
// app/dashboard/page.tsx
async function DashboardPage() {
  // Data fetching is traced
  const data = await fetch('https://api.example.com/stats');
  return <Dashboard data={data} />;
}
```

#### 3. **Middleware**

```ts
// middleware.ts
export function middleware(request: NextRequest) {
  // Middleware execution is traced
  const token = request.cookies.get('auth-token');
  if (!token) {
    return NextResponse.redirect('/login');
  }
}
```

#### 4. **Database Queries**

If using instrumented database clients (e.g., Prisma with OTel), each query becomes a span:

```
API Request: POST /api/orders (500ms)
  ├─ Validate Input (10ms)
  ├─ Check Inventory (150ms)
  │   └─ DB Query: SELECT * FROM products WHERE id=$1 (140ms)
  ├─ Create Order (200ms)
  │   ├─ DB Query: INSERT INTO orders... (100ms)
  │   └─ DB Query: UPDATE inventory... (90ms)
  └─ Send Confirmation Email (140ms)
```

### @vercel/otel Benefits

The `@vercel/otel` package provides:
- **Zero-config setup**: Works out of the box on Vercel
- **Automatic instrumentation**: Captures fetch calls, database queries
- **Vercel integration**: Seamlessly sends traces to Vercel's infrastructure
- **Custom endpoint support**: Can configure to send to your own OTLP collector

---

## Source Map Management

### Why Source Maps Matter

When JavaScript is minified in production, error stack traces become unreadable:

```
❌ Without source maps:
Error: Cannot read property 'name' of undefined
  at e.t (main.a3f2b1c.js:1:2345)
  at r (vendors.d4e5f6.js:12:6789)

✅ With source maps:
Error: Cannot read property 'name' of undefined
  at UserProfile.render (components/UserProfile.tsx:45:12)
  at App.renderComponent (app/layout.tsx:23:8)
```

### Configuration

#### 1. Enable Production Source Maps

**Frontend** ([`apps/frontend/next.config.ts`](apps/frontend/next.config.ts)):

```ts
const nextConfig: NextConfig = {
  // Generate .map files in production builds
  productionBrowserSourceMaps: true,
  
  // ... other config
};
```

**Admin** ([`apps/admin/next.config.ts`](apps/admin/next.config.ts)):

```ts
const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  // ... other config
};
```

#### 2. Automatic Source Map Upload

```ts
import FaroSourceMapUploaderPlugin from '@grafana/faro-webpack-plugin';

const nextConfig: NextConfig = {
  webpack: (config, { isServer, dev }) => {
    // Only upload in production client builds
    if (!dev && !isServer && process.env.FARO_SOURCE_MAP_API_KEY) {
      config.plugins.push(
        new FaroSourceMapUploaderPlugin({
          appName: 'starter-frontend', // or 'starter-admin'
          endpoint: 'https://faro-api-prod-us-west-0.grafana.net/faro/api/v1',
          appId: process.env.NEXT_PUBLIC_FARO_APP_ID || '',
          stackId: process.env.FARO_STACK_ID || '',
          verbose: true, // Log upload progress
          apiKey: process.env.FARO_SOURCE_MAP_API_KEY,
          gzipContents: true, // Compress before uploading
        })
      );
    }
    return config;
  },
};
```

### Upload Process

```
Build Process:
1. Next.js compiles TypeScript → JavaScript
2. Code is minified and bundled
3. Source maps (.js.map) are generated
4. FaroSourceMapUploaderPlugin uploads .map files to Grafana
5. Original source maps are kept locally (optional: can delete for security)

When Error Occurs:
1. User encounters error
2. Faro sends minified stack trace to Grafana
3. Grafana looks up corresponding source map
4. Stack trace is "deobfuscated" to show original code
```

### Security Considerations

**Option 1: Upload and Delete** (Most Secure)
```bash
# After build, remove source maps from public bundle
rm -rf .next/**/*.map
```

**Option 2: Restrict Access** (Balanced)
```nginx
# Only allow source map access from your IP
location ~* \.map$ {
  allow 203.0.113.0/24;  # Your office IP range
  deny all;
}
```

**Option 3: Keep Public** (Easiest, Less Secure)
- Source maps are publicly accessible
- Anyone can reverse-engineer your code
- Only acceptable for open-source projects

---

## Error Handling & Recovery

### Chunk Loading Failures

When users have poor network conditions, JavaScript chunks may fail to load. The retry plugin handles this gracefully.

#### Configuration

```ts
import { RetryChunkLoadPlugin } from 'webpack-retry-chunk-load-plugin';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new RetryChunkLoadPlugin({
          maxRetries: 3,        // Try up to 3 times
          retryDelay: 1000,     // Wait 1 second between retries
        })
      );
    }
    return config;
  },
};
```

#### How It Works

```
User clicks button → Loads chunk-abc123.js
  ├─ Attempt 1: Failed (network timeout)
  ├─ Wait 1 second...
  ├─ Attempt 2: Failed (503 error)
  ├─ Wait 1 second...
  ├─ Attempt 3: Success! ✓
  └─ Component renders

If all 3 attempts fail:
  → Shows user-friendly error message
  → Error is logged to Grafana Faro
  → User can refresh page to try again
```

#### Benefits

- **Improved UX**: Transparent retries prevent random "chunk load error" messages
- **Network resilience**: Handles temporary CDN issues
- **Mobile-friendly**: Essential for users on spotty mobile connections

---

## Configuration Guide

### Environment Variables

Both **frontend** and **admin** apps use identical environment variable structures.

#### Frontend ([`apps/frontend/.env.example`](apps/frontend/.env.example))

```bash
# ============================================
# CLIENT-SIDE MONITORING (Grafana Faro)
# ============================================

# Faro collector endpoint (from Grafana Cloud)
NEXT_PUBLIC_FARO_URL=https://faro-collector-prod-us-west-0.grafana.net/collect/<your-key>

# Application identifier (shows up in Grafana)
NEXT_PUBLIC_FARO_APP_NAME=starter-frontend

# Optional: Namespace for multi-tenant setups
NEXT_PUBLIC_FARO_APP_NAMESPACE=production

# Semantic version for tracking deployments
NEXT_PUBLIC_FARO_APP_VERSION=1.0.0

# Environment name
NEXT_PUBLIC_FARO_ENVIRONMENT=development

# ============================================
# SOURCE MAP UPLOAD
# ============================================

# Secret API key for uploading source maps (NEVER expose to client!)
FARO_SOURCE_MAP_API_KEY=glsa_xxxxxxxxxxxxxxxxxxxx

# Your Faro app ID (from Grafana Cloud)
NEXT_PUBLIC_FARO_APP_ID=12345

# Your Grafana stack ID
FARO_STACK_ID=67890

# ============================================
# SERVER-SIDE TRACING (OpenTelemetry)
# ============================================

# Optional: Custom OTLP endpoint (defaults to Vercel)
# OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otel-collector-endpoint

# Optional: Authentication headers for custom OTLP
# OTEL_EXPORTER_OTLP_HEADERS=x-api-key=your-api-key

# Service name (already set in instrumentation.ts)
# OTEL_SERVICE_NAME=starter-frontend
```

#### Admin ([`apps/admin/.env.example`](apps/admin/.env.example))

```bash
# Identical structure, but with admin-specific names
NEXT_PUBLIC_FARO_URL=https://faro-collector-prod-us-west-0.grafana.net/collect/<your-key>
NEXT_PUBLIC_FARO_APP_NAME=starter-admin
# ... rest is the same
```

### Getting Grafana Cloud Credentials

#### Step 1: Create Grafana Cloud Account
1. Go to [grafana.com](https://grafana.com)
2. Sign up for free tier (includes Faro)
3. Create a new stack

#### Step 2: Setup Faro App
1. Navigate to **Application Observability** → **Faro**
2. Click **Create new app**
3. Enter app name: `starter-frontend` (or `starter-admin`)
4. Copy the collector URL
   ```
   https://faro-collector-prod-us-west-0.grafana.net/collect/abc123xyz
   ```
5. Set as `NEXT_PUBLIC_FARO_URL`

#### Step 3: Get App ID and Stack ID
1. In Faro app settings, find **App ID**
2. In Grafana Cloud home, find **Stack ID**

#### Step 4: Generate Source Map API Key
1. Go to **Configuration** → **API Keys**
2. Create new key with **SourceMapUploader** role
3. Copy the key (starts with `glsa_`)
4. Set as `FARO_SOURCE_MAP_API_KEY` (keep secret!)

---

## Production Best Practices

### 1. Environment-Specific Configuration

```bash
# .env.development
NEXT_PUBLIC_FARO_ENVIRONMENT=development
NEXT_PUBLIC_FARO_APP_VERSION=1.0.0-dev

# .env.staging
NEXT_PUBLIC_FARO_ENVIRONMENT=staging
NEXT_PUBLIC_FARO_APP_VERSION=1.0.0-rc.1

# .env.production
NEXT_PUBLIC_FARO_ENVIRONMENT=production
NEXT_PUBLIC_FARO_APP_VERSION=1.0.0
```

### 2. Version Tracking

Update `NEXT_PUBLIC_FARO_APP_VERSION` with each deployment:

```json
// package.json
{
  "version": "1.2.3"
}
```

```bash
# In CI/CD pipeline
export NEXT_PUBLIC_FARO_APP_VERSION=$(node -p "require('./package.json').version")
pnpm run build
```

### 3. Sampling (for High-Traffic Apps)

To reduce costs on high-traffic sites, implement sampling:

```tsx
// frontend-observability.tsx
initializeFaro({
  // ... other config
  sessionTracking: {
    enabled: true,
    samplingRate: 0.5, // Track 50% of sessions
  },
});
```

### 4. PII (Personally Identifiable Information) Scrubbing

```tsx
import { faro } from '@grafana/faro-web-sdk';

// Scrub sensitive data before sending
faro.api?.pushLog(['User signed up'], {
  level: LogLevel.INFO,
  context: {
    userId: user.id,
    // ❌ Don't send: email, phone, credit card
    // ✅ Do send: anonymized identifiers
  },
});
```

### 5. Custom Error Boundaries

```tsx
import { faro } from '@grafana/faro-web-sdk';

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Manually send to Faro with additional context
    faro.api?.pushError(error, {
      context: {
        componentStack: errorInfo.componentStack,
        userAction: 'checkout',
      },
    });
  }
}
```

### 6. Monitoring Dashboard Setup

Create Grafana dashboards to visualize:

**Client-Side (Faro)**:
- Error rate by page
- Console error trends
- Web Vitals by country
- Session duration
- Browser/OS distribution

**Server-Side (OTel)**:
- API endpoint latency (p50, p95, p99)
- Error rate by endpoint
- Request volume
- Database query performance
- External API call duration

### 7. Alerting

Set up alerts in Grafana:

```
Alert: High Error Rate
Condition: error_count > 100 in last 5 minutes
Notify: Slack #engineering, PagerDuty

Alert: Slow API Endpoint
Condition: p95_latency > 2 seconds for /api/checkout
Notify: Slack #backend
```

---

## Troubleshooting

### Issue 1: Faro Not Sending Data

**Symptoms:**
- No errors showing in Grafana
- Console shows "Faro URL not configured"

**Solutions:**

1. Check environment variables are loaded:
   ```tsx
   console.log('Faro URL:', process.env.NEXT_PUBLIC_FARO_URL);
   ```

2. Ensure variable is prefixed with `NEXT_PUBLIC_` (required for client-side access)

3. Restart dev server after changing `.env` files

4. Check browser console for Faro errors:
   ```
   Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
   → Ad blocker is blocking Faro requests
   ```

5. Verify Faro URL is correct (visit in browser, should return JSON)

### Issue 2: Source Maps Not Working

**Symptoms:**
- Errors show minified stack traces
- Grafana doesn't deobfuscate errors

**Solutions:**

1. Verify `productionBrowserSourceMaps: true` in `next.config.ts`

2. Check API key has correct permissions:
   ```bash
   curl -H "Authorization: Bearer glsa_xxx..." \
     https://faro-api-prod-us-west-0.grafana.net/faro/api/v1
   ```

3. Check webpack build logs for upload confirmation:
   ```
   ✓ Uploading source maps to Grafana Faro...
   ✓ Uploaded 23 source maps successfully
   ```

4. Verify `appId` and `stackId` are correct

5. Ensure `appName` in webpack plugin matches Faro app name exactly

### Issue 3: OpenTelemetry Not Tracing

**Symptoms:**
- No traces in Grafana Tempo
- `instrumentation.ts` not being called

**Solutions:**

1. Check Next.js version (instrumentation requires Next.js 13.4+)

2. Ensure file is named exactly `instrumentation.ts` (or `.js`)

3. Place in **root of app directory** (not in subdirectory)

4. Verify `register()` function is exported

5. Check server logs for:
   ```
   🔍 [Instrumentation] OpenTelemetry initializing for starter-frontend...
   ```

6. If using custom OTLP endpoint, verify connectivity:
   ```bash
   curl -X POST https://your-otel-collector/v1/traces \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

### Issue 4: High Monitoring Costs

**Symptoms:**
- Grafana Cloud bill is high
- Approaching free tier limits

**Solutions:**

1. Implement session sampling:
   ```tsx
   sessionTracking: { samplingRate: 0.25 } // 25% of sessions
   ```

2. Filter out noisy errors:
   ```tsx
   beforeSend: (event) => {
     // Ignore known browser extension errors
     if (event.message?.includes('chrome-extension://')) {
       return null;
     }
     return event;
   }
   ```

3. Reduce console log capture level:
   ```tsx
   captureConsoleDisabledLevels: [
     LogLevel.DEBUG,
     LogLevel.TRACE,
     LogLevel.LOG, // Disable console.log
   ]
   ```

4. Set up log aggregation (instead of individual events)

5. Consider self-hosting Grafana for unlimited ingestion

### Issue 5: Chunk Load Errors Still Occurring

**Symptoms:**
- Users still getting "ChunkLoadError"
- Retries not working

**Solutions:**

1. Increase retry count:
   ```ts
   new RetryChunkLoadPlugin({
     maxRetries: 5,
     retryDelay: 2000,
   })
   ```

2. Check CDN health (if using custom CDN)

3. Verify chunks are properly uploaded to hosting

4. Consider implementing service worker for offline support

5. Add fallback error UI:
   ```tsx
   window.addEventListener('vite:preloadError', (event) => {
     window.location.reload(); // Force full page reload
   });
   ```

---

## Advanced Usage

### Custom Instrumentation

#### Track Custom Events

```tsx
import { faro } from '@grafana/faro-web-sdk';

function trackPurchase(orderId: string, amount: number) {
  faro.api?.pushEvent('purchase_completed', {
    orderId,
    amount,
    currency: 'USD',
    timestamp: Date.now(),
  });
}
```

#### Manual Error Logging

```tsx
try {
  await riskyOperation();
} catch (error) {
  faro.api?.pushError(error as Error, {
    context: {
      operation: 'payment_processing',
      userId: user.id,
      retryCount: 3,
    },
  });
}
```

#### Performance Measurements

```tsx
import { faro } from '@grafana/faro-web-sdk';

const startTime = performance.now();
await loadHeavyComponent();
const duration = performance.now() - startTime;

faro.api?.pushMeasurement({
  type: 'component_load_time',
  values: { duration },
  context: { component: 'Dashboard' },
});
```

### Distributed Tracing

Link client-side (Faro) and server-side (OTel) traces:

```tsx
// Client sends trace ID to server
const response = await fetch('/api/data', {
  headers: {
    'X-Trace-Id': faro.api?.getSession()?.id,
  },
});

// Server includes in span
export async function GET(request: Request) {
  const traceId = request.headers.get('X-Trace-Id');
  // Add to span attributes
  trace.getActiveSpan()?.setAttribute('client_trace_id', traceId);
}
```

---

## Summary

### What You Get

✅ **Automatic Error Tracking**: All client & server errors sent to Grafana  
✅ **Performance Monitoring**: Web Vitals, API latency, database queries  
✅ **Source Map Deobfuscation**: Readable stack traces in production  
✅ **User Session Tracking**: Replay error sequences to understand context  
✅ **Network Resilience**: Automatic retry for failed chunk loads  
✅ **Distributed Tracing**: Follow requests from browser → API → database  
✅ **Zero-Config Production**: Works out of the box on Vercel  
✅ **Cost-Effective**: Generous free tier, optional sampling for scale  

### What You Need to Do

1. **Get Grafana Cloud account** (free)
2. **Create Faro apps** for frontend & admin
3. **Copy credentials** to `.env.local`
4. **Deploy** (source maps upload automatically)
5. **Monitor** via Grafana dashboards

---

## Resources

- [Grafana Faro Documentation](https://grafana.com/docs/grafana-cloud/faro-web-sdk/)
- [OpenTelemetry JS](https://opentelemetry.io/docs/instrumentation/js/)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [Vercel OTel Guide](https://vercel.com/docs/observability/otel-overview)
- [Web Vitals](https://web.dev/vitals/)

---

**Last Updated:** March 24, 2026  
**Maintained By:** Engineering Team

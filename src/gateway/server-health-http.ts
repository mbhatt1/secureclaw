/**
 * HTTP health check endpoints for Kubernetes/Docker compatibility
 *
 * Provides /health/live and /health/ready endpoints for container orchestration.
 * These complement the existing WebSocket-based health checks.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { HealthSummary } from "../commands/health.js";
import { getHealthCache, getHealthSnapshot } from "../commands/health.js";
import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("gateway:health-http");

/**
 * Send JSON response
 */
function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.end(JSON.stringify(body, null, 2));
}

/**
 * Liveness probe - checks if the process is alive and can handle requests.
 * Does not verify external dependencies. Use this for Kubernetes liveness probes.
 *
 * Returns 200 if:
 * - Process is running
 * - Node.js event loop is responsive
 *
 * Endpoint: GET /health/live
 */
export async function handleLivenessProbe(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname !== "/health/live") {
    return false;
  }

  try {
    const uptime = Math.round(process.uptime() * 1000); // milliseconds
    const memoryUsage = process.memoryUsage();

    sendJson(res, 200, {
      status: "ok",
      alive: true,
      uptimeMs: uptime,
      timestamp: new Date().toISOString(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      nodeVersion: process.version,
    });

    return true;
  } catch (err) {
    log.error("liveness probe failed", err);
    sendJson(res, 500, {
      status: "error",
      alive: false,
      error: String(err),
    });
    return true;
  }
}

/**
 * Readiness probe - checks if the service is ready to accept traffic.
 * Verifies external dependencies (channels, database, etc.).
 * Use this for Kubernetes readiness probes.
 *
 * Returns 200 if:
 * - Process is alive
 * - Health snapshot can be retrieved
 * - Channels are operational (when probed)
 *
 * Query parameters:
 * - probe=true: Perform active channel probes (slower, more thorough)
 * - timeout=5000: Timeout in milliseconds (default: 5000)
 *
 * Endpoint: GET /health/ready
 */
export async function handleReadinessProbe(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname !== "/health/ready") {
    return false;
  }

  try {
    const wantsProbe = url.searchParams.get("probe") === "true";
    const timeoutParam = url.searchParams.get("timeout");
    const timeoutMs = timeoutParam ? Number.parseInt(timeoutParam, 10) : 5000;

    // Try to use cached health snapshot for fast readiness checks
    const cached = wantsProbe ? null : getHealthCache();
    const now = Date.now();
    const CACHE_MAX_AGE_MS = 60_000; // 1 minute

    let health: HealthSummary;
    if (cached && now - cached.ts < CACHE_MAX_AGE_MS) {
      health = cached;
      log.debug("readiness probe using cached health snapshot");
    } else {
      health = await getHealthSnapshot({
        probe: wantsProbe,
        timeoutMs: timeoutMs > 0 && timeoutMs <= 30000 ? timeoutMs : 5000,
      });
      log.debug("readiness probe fetched fresh health snapshot", {
        durationMs: health.durationMs,
        probe: wantsProbe,
      });
    }

    // Check if any critical channels are down
    const channelIssues: string[] = [];
    for (const [channelId, channelSummary] of Object.entries(health.channels ?? {})) {
      // Check if channel is explicitly not linked
      if (channelSummary.linked === false) {
        channelIssues.push(`${channelId}: not linked`);
      }

      // Check if probe explicitly failed
      const probe = channelSummary.probe as { ok?: boolean } | undefined;
      if (probe && probe.ok === false) {
        channelIssues.push(`${channelId}: probe failed`);
      }
    }

    // Determine readiness status
    const ready = channelIssues.length === 0;
    const status = ready ? "ready" : "degraded";
    const statusCode = ready ? 200 : 503;

    sendJson(res, statusCode, {
      status,
      ready,
      timestamp: new Date().toISOString(),
      healthCheckDurationMs: health.durationMs,
      channels: Object.keys(health.channels ?? {}).length,
      agents: health.agents?.length ?? 0,
      sessions: health.sessions?.count ?? 0,
      ...(channelIssues.length > 0 && { issues: channelIssues }),
      ...(health.ioMetrics && {
        metrics: {
          diskWritesPerMin: health.ioMetrics.disk.writesPerMin,
          networkMbps: health.ioMetrics.network.mbps,
          cacheHitRate: health.ioMetrics.cache.hitRate,
        },
      }),
    });

    return true;
  } catch (err) {
    log.error("readiness probe failed", err);
    sendJson(res, 503, {
      status: "error",
      ready: false,
      error: String(err),
      timestamp: new Date().toISOString(),
    });
    return true;
  }
}

/**
 * Legacy /health endpoint (redirects to /health/ready)
 */
export async function handleLegacyHealthEndpoint(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname !== "/health") {
    return false;
  }

  // Redirect to /health/ready
  log.debug("legacy /health endpoint called, redirecting to /health/ready");
  const newUrl = `/health/ready${url.search}`;
  req.url = newUrl;
  return handleReadinessProbe(req, res);
}

/**
 * Main HTTP health check handler
 * Routes requests to appropriate health check handlers
 */
export async function handleHealthHttpRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");

  // Only handle GET requests
  if (req.method !== "GET") {
    return false;
  }

  // Route to appropriate handler
  if (url.pathname === "/health/live") {
    return handleLivenessProbe(req, res);
  }

  if (url.pathname === "/health/ready") {
    return handleReadinessProbe(req, res);
  }

  if (url.pathname === "/health") {
    return handleLegacyHealthEndpoint(req, res);
  }

  return false;
}

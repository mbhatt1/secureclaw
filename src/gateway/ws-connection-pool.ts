import type { GatewayWsClient } from "./server/ws-types.js";

/**
 * WebSocket connection pool with memory limits for Raspberry Pi
 *
 * Features:
 * - Enforces max connection limit to prevent memory exhaustion
 * - Idle connection cleanup (WeakMap for auto-GC)
 * - Activity tracking for timeout management
 */
export class WSConnectionPool {
  private clients: Set<GatewayWsClient>;
  private clientMetadata: WeakMap<GatewayWsClient, ClientMetadata>;
  private readonly maxConnections: number;
  private readonly idleTimeoutMs: number;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(opts: { maxConnections?: number; idleTimeoutMs?: number }) {
    this.maxConnections = opts.maxConnections ?? 50;
    this.idleTimeoutMs = opts.idleTimeoutMs ?? 300_000; // 5 minutes
    this.clients = new Set();
    this.clientMetadata = new WeakMap();
    this.startCleanup();
  }

  add(client: GatewayWsClient): boolean {
    // Enforce connection limit
    if (this.clients.size >= this.maxConnections) {
      return false;
    }

    this.clients.add(client);
    this.clientMetadata.set(client, {
      lastActivity: Date.now(),
      addedAt: Date.now(),
    });
    return true;
  }

  remove(client: GatewayWsClient): boolean {
    return this.clients.delete(client);
  }

  updateActivity(client: GatewayWsClient): void {
    const metadata = this.clientMetadata.get(client);
    if (metadata) {
      metadata.lastActivity = Date.now();
    }
  }

  getAll(): Set<GatewayWsClient> {
    return this.clients;
  }

  size(): number {
    return this.clients.size;
  }

  has(client: GatewayWsClient): boolean {
    return this.clients.has(client);
  }

  getMetadata(client: GatewayWsClient): ClientMetadata | undefined {
    return this.clientMetadata.get(client);
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleConnections();
    }, 60_000); // Check every minute
    this.cleanupTimer.unref(); // Don't keep process alive
  }

  private cleanupIdleConnections(): void {
    const now = Date.now();
    const toRemove: GatewayWsClient[] = [];

    for (const client of this.clients) {
      const metadata = this.clientMetadata.get(client);
      if (metadata && now - metadata.lastActivity > this.idleTimeoutMs) {
        toRemove.push(client);
      }
    }

    for (const client of toRemove) {
      try {
        // Close idle connection
        client.ws.close(1000, "Idle timeout");
      } catch {
        // Already closed
      }
      this.clients.delete(client);
    }

    if (toRemove.length > 0) {
      // Force GC after cleanup to free memory
      if (global.gc) {
        global.gc();
      }
    }
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

interface ClientMetadata {
  lastActivity: number;
  addedAt: number;
}

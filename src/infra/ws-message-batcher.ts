/**
 * WebSocket message batcher for reduced network I/O
 *
 * Batches non-critical WebSocket messages to reduce the number of
 * network sends while keeping critical messages immediate.
 */

import type WebSocket from "ws";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { recordNetworkSent } from "./io-metrics.js";

const log = createSubsystemLogger("ws-message-batcher");

export type MessageBatcherConfig = {
  /** Batch interval in milliseconds (default: 100) */
  batchIntervalMs?: number;
  /** Maximum batch size before forced flush (default: 20) */
  maxBatchSize?: number;
  /** Enable batching (default: true) */
  enabled?: boolean;
};

const DEFAULT_CONFIG = {
  batchIntervalMs: 100,
  maxBatchSize: 20,
  enabled: true,
};

export type MessagePriority = "critical" | "normal";

type PendingMessage = {
  data: string | Buffer;
  priority: MessagePriority;
  timestamp: number;
};

/**
 * WebSocket message batcher
 */
export class WSMessageBatcher {
  private pending: PendingMessage[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly config: Required<MessageBatcherConfig>;
  private totalBatched = 0;
  private totalSent = 0;
  private closed = false;

  constructor(
    private ws: WebSocket,
    config: MessageBatcherConfig = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Send a message through the batcher
   */
  send(data: string | Buffer, priority: MessagePriority = "normal"): void {
    if (this.closed) {
      return;
    }

    if (!this.config.enabled || priority === "critical") {
      // Send critical messages immediately
      this.sendImmediate(data);
      return;
    }

    // Add to pending batch
    this.pending.push({
      data,
      priority,
      timestamp: Date.now(),
    });

    // Check if we should flush
    if (this.pending.length >= this.config.maxBatchSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  /**
   * Send a message immediately without batching
   */
  private sendImmediate(data: string | Buffer): void {
    try {
      this.ws.send(data);
      this.totalSent++;
      recordNetworkSent(typeof data === "string" ? Buffer.byteLength(data) : data.length);
    } catch (err) {
      log.warn("failed to send immediate message", { error: String(err) });
    }
  }

  /**
   * Schedule a flush if not already scheduled
   */
  private scheduleFlush(): void {
    if (this.timer) {
      return;
    }

    this.timer = setTimeout(() => {
      this.flush();
    }, this.config.batchIntervalMs);
  }

  /**
   * Flush all pending messages
   */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.pending.length === 0) {
      return;
    }

    const messages = this.pending.slice();
    this.pending = [];

    // For now, send messages individually
    // Future: could combine into a single batch message
    for (const msg of messages) {
      try {
        this.ws.send(msg.data);
        this.totalBatched++;
        recordNetworkSent(
          typeof msg.data === "string" ? Buffer.byteLength(msg.data) : msg.data.length,
        );
      } catch (err) {
        log.warn("failed to send batched message", { error: String(err) });
      }
    }

    this.totalSent++;

    if (this.totalBatched > 0 && this.totalSent % 100 === 0) {
      log.debug("ws message batcher stats", {
        totalBatched: this.totalBatched,
        totalSent: this.totalSent,
        avgBatchSize: (this.totalBatched / this.totalSent).toFixed(1),
      });
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalBatched: number;
    totalSent: number;
    pendingMessages: number;
    avgBatchSize: number;
  } {
    return {
      totalBatched: this.totalBatched,
      totalSent: this.totalSent,
      pendingMessages: this.pending.length,
      avgBatchSize: this.totalSent > 0 ? this.totalBatched / this.totalSent : 0,
    };
  }

  /**
   * Close the batcher and flush remaining messages
   */
  close(): void {
    if (this.closed) {
      return;
    }

    this.closed = true;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.flush();
  }
}

/**
 * Create a WebSocket message batcher
 */
export function createWSMessageBatcher(
  ws: WebSocket,
  config?: MessageBatcherConfig,
): WSMessageBatcher {
  return new WSMessageBatcher(ws, config);
}

/**
 * Check if WebSocket message batching is enabled via environment variable
 */
export function isWSMessageBatchingEnabled(): boolean {
  const envValue = process.env.SECURECLAW_WS_MESSAGE_BATCHING;
  return envValue !== "false" && envValue !== "0";
}

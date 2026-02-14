/**
 * WebSocket message batcher for reduced network overhead
 *
 * Batches non-critical messages to reduce WebSocket frame overhead
 * and network traffic. Critical messages are sent immediately.
 */

import type { WebSocket } from "ws";
import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("message-batcher");

export type MessagePriority = "immediate" | "high" | "normal" | "low";

export type BatchableMessage = {
  type: string;
  priority?: MessagePriority;
  [key: string]: unknown;
};

export type MessageBatcherConfig = {
  /** Batch interval in milliseconds */
  batchIntervalMs?: number;
  /** Maximum batch size (number of messages) */
  maxBatchSize?: number;
  /** Enable compression for large batches */
  enableCompression?: boolean;
  /** Minimum batch size to enable compression */
  compressionThreshold?: number;
};

const DEFAULT_CONFIG = {
  batchIntervalMs: 1000,
  maxBatchSize: 10,
  enableCompression: false,
  compressionThreshold: 5,
};

export class MessageBatcher {
  private queues = new Map<WebSocket, Map<string, BatchableMessage[]>>();
  private timers = new Map<WebSocket, Map<string, NodeJS.Timeout>>();
  private readonly config: Required<MessageBatcherConfig>;
  private totalMessages = 0;
  private totalBatches = 0;
  private totalImmediate = 0;

  constructor(config: MessageBatcherConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Schedule a message for sending
   * High priority messages are sent immediately
   */
  schedule(ws: WebSocket, message: BatchableMessage, batchKey = "default"): void {
    const priority = message.priority ?? "normal";

    // Send immediate/high priority messages directly
    if (priority === "immediate" || priority === "high") {
      this.sendImmediate(ws, message);
      return;
    }

    // Add to batch queue
    this.addToBatch(ws, message, batchKey);

    // Get batch for this connection and key
    const connectionQueues = this.queues.get(ws);
    const queue = connectionQueues?.get(batchKey);

    // Flush if batch is full
    if (queue && queue.length >= this.config.maxBatchSize) {
      void this.flush(ws, batchKey);
    } else {
      this.scheduleFlush(ws, batchKey);
    }
  }

  /**
   * Send a message immediately without batching
   */
  private sendImmediate(ws: WebSocket, message: BatchableMessage): void {
    if (ws.readyState !== ws.OPEN) {
      return;
    }

    try {
      ws.send(JSON.stringify(message));
      this.totalImmediate++;
    } catch (err) {
      log.error("failed to send immediate message", { error: String(err) });
    }
  }

  /**
   * Add a message to the batch queue
   */
  private addToBatch(ws: WebSocket, message: BatchableMessage, batchKey: string): void {
    let connectionQueues = this.queues.get(ws);
    if (!connectionQueues) {
      connectionQueues = new Map();
      this.queues.set(ws, connectionQueues);
    }

    let queue = connectionQueues.get(batchKey);
    if (!queue) {
      queue = [];
      connectionQueues.set(batchKey, queue);
    }

    queue.push(message);
    this.totalMessages++;
  }

  /**
   * Schedule a flush for a specific batch
   */
  private scheduleFlush(ws: WebSocket, batchKey: string): void {
    let connectionTimers = this.timers.get(ws);
    if (!connectionTimers) {
      connectionTimers = new Map();
      this.timers.set(ws, connectionTimers);
    }

    if (connectionTimers.has(batchKey)) {
      return;
    }

    const timer = setTimeout(() => {
      void this.flush(ws, batchKey);
    }, this.config.batchIntervalMs);

    // Allow Node.js to exit even with timer running
    timer.unref();

    connectionTimers.set(batchKey, timer);
  }

  /**
   * Flush a specific batch
   */
  async flush(ws: WebSocket, batchKey: string): Promise<void> {
    // Clear timer
    const connectionTimers = this.timers.get(ws);
    const timer = connectionTimers?.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      connectionTimers?.delete(batchKey);
    }

    // Get messages
    const connectionQueues = this.queues.get(ws);
    const queue = connectionQueues?.get(batchKey);

    if (!queue || queue.length === 0) {
      return;
    }

    // Send batch
    if (ws.readyState !== ws.OPEN) {
      log.warn("websocket not open, dropping batch", {
        batchKey,
        messageCount: queue.length,
      });
      connectionQueues?.delete(batchKey);
      return;
    }

    try {
      const batch = {
        type: "batch",
        batchKey,
        count: queue.length,
        messages: queue,
        timestamp: Date.now(),
      };

      ws.send(JSON.stringify(batch));

      this.totalBatches++;

      if (this.totalBatches % 100 === 0) {
        this.logStats();
      }
    } catch (err) {
      log.error("failed to send batch", {
        batchKey,
        messageCount: queue.length,
        error: String(err),
      });
    } finally {
      connectionQueues?.delete(batchKey);
    }
  }

  /**
   * Flush all batches for a specific connection
   */
  async flushConnection(ws: WebSocket): Promise<void> {
    const connectionQueues = this.queues.get(ws);
    if (!connectionQueues) {
      return;
    }

    const batchKeys = Array.from(connectionQueues.keys());

    for (const batchKey of batchKeys) {
      await this.flush(ws, batchKey);
    }
  }

  /**
   * Flush all batches for all connections
   */
  async flushAll(): Promise<void> {
    const connections = Array.from(this.queues.keys());

    for (const ws of connections) {
      await this.flushConnection(ws);
    }
  }

  /**
   * Clean up resources for a closed connection
   */
  onConnectionClose(ws: WebSocket): void {
    // Clear timers
    const connectionTimers = this.timers.get(ws);
    if (connectionTimers) {
      for (const timer of connectionTimers.values()) {
        clearTimeout(timer);
      }
      this.timers.delete(ws);
    }

    // Remove queues
    this.queues.delete(ws);
  }

  /**
   * Get batcher statistics
   */
  getStats(): {
    totalMessages: number;
    totalBatches: number;
    totalImmediate: number;
    avgBatchSize: number;
    batchingRate: number;
  } {
    const avgBatchSize = this.totalBatches > 0 ? this.totalMessages / this.totalBatches : 0;
    const total = this.totalMessages + this.totalImmediate;
    const batchingRate = total > 0 ? (this.totalMessages / total) * 100 : 0;

    return {
      totalMessages: this.totalMessages,
      totalBatches: this.totalBatches,
      totalImmediate: this.totalImmediate,
      avgBatchSize,
      batchingRate,
    };
  }

  /**
   * Log statistics
   */
  private logStats(): void {
    const stats = this.getStats();
    log.debug("message batcher stats", {
      ...stats,
      avgBatchSize: stats.avgBatchSize.toFixed(1),
      batchingRate: `${stats.batchingRate.toFixed(1)}%`,
    });
  }

  /**
   * Close the batcher and flush all pending messages
   */
  async close(): Promise<void> {
    // Clear all timers
    for (const connectionTimers of this.timers.values()) {
      for (const timer of connectionTimers.values()) {
        clearTimeout(timer);
      }
    }
    this.timers.clear();

    // Flush all pending batches
    await this.flushAll();

    this.logStats();
  }
}

/**
 * Create a message batcher instance
 */
export function createMessageBatcher(config?: MessageBatcherConfig): MessageBatcher {
  return new MessageBatcher(config);
}

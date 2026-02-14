// ---------------------------------------------------------------------------
// Security Coach – Worker Thread Pool for CPU-Heavy Operations
// ---------------------------------------------------------------------------
// Offloads pattern matching and LLM evaluation to worker threads to avoid
// blocking the main event loop on low-power ARM processors.
//
// FEATURES:
// - Thread pool with configurable size (defaults to CPU core count - 1)
// - Round-robin task distribution
// - Fallback to main thread if workers unavailable
// - Graceful shutdown
// - Error isolation (worker crashes don't affect main thread)
//
// TARGET: Utilize all 4 cores on Raspberry Pi 4, keep main thread responsive
// ---------------------------------------------------------------------------

import { cpus } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import type { ThreatMatchInput, ThreatMatch } from "./patterns.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkerTask =
  | {
      type: "match-threats";
      input: ThreatMatchInput;
    }
  | {
      type: "batch-match";
      inputs: ThreatMatchInput[];
    };

export type WorkerResult =
  | {
      type: "match-threats";
      matches: ThreatMatch[];
      duration: number;
    }
  | {
      type: "batch-match";
      results: Array<{ matches: ThreatMatch[]; duration: number }>;
    }
  | {
      type: "error";
      error: string;
    };

type PendingTask = {
  task: WorkerTask;
  resolve: (result: WorkerResult) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
};

// ---------------------------------------------------------------------------
// Worker Pool
// ---------------------------------------------------------------------------

export class SecurityCoachWorkerPool {
  private workers: Worker[] = [];
  private nextWorkerIndex = 0;
  private pendingTasks = new Map<number, PendingTask>();
  private taskIdCounter = 0;
  private poolSize: number;
  private workerScriptPath: string;
  private initialized = false;
  private taskTimeout: number;

  constructor(opts?: { poolSize?: number; workerScriptPath?: string; taskTimeout?: number }) {
    // Default to CPU cores - 1 (leave one for main thread)
    this.poolSize = opts?.poolSize ?? Math.max(1, cpus().length - 1);
    this.taskTimeout = opts?.taskTimeout ?? 5000; // 5s default timeout

    // Resolve worker script path
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    this.workerScriptPath = opts?.workerScriptPath ?? path.join(__dirname, "worker-thread.js");
  }

  /**
   * Initialize the worker pool.
   * Must be called before execute().
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerScriptPath);

      // Handle messages from worker
      worker.on("message", (msg: { taskId: number; result: WorkerResult }) => {
        const pending = this.pendingTasks.get(msg.taskId);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingTasks.delete(msg.taskId);
          pending.resolve(msg.result);
        }
      });

      // Handle worker errors
      worker.on("error", (err: Error) => {
        console.error(`[worker-pool] Worker ${i} error:`, err);
        // Reject all pending tasks for this worker
        for (const [taskId, pending] of this.pendingTasks) {
          pending.reject(new Error(`Worker error: ${err.message}`));
          clearTimeout(pending.timeout);
          this.pendingTasks.delete(taskId);
        }
      });

      // Handle worker exit
      worker.on("exit", (code) => {
        if (code !== 0) {
          console.error(`[worker-pool] Worker ${i} exited with code ${code}`);
        }
      });

      this.workers.push(worker);
    }

    this.initialized = true;
  }

  /**
   * Execute a task on a worker thread.
   *
   * Returns a promise that resolves with the result or rejects on timeout/error.
   */
  async execute(task: WorkerTask): Promise<WorkerResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const taskId = this.taskIdCounter++;
    const worker = this.workers[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;

    return new Promise<WorkerResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingTasks.delete(taskId);
        reject(new Error(`Task ${taskId} timed out after ${this.taskTimeout}ms`));
      }, this.taskTimeout);

      this.pendingTasks.set(taskId, {
        task,
        resolve,
        reject,
        timeout,
      });

      worker.postMessage({ taskId, task });
    });
  }

  /**
   * Shutdown all workers and clean up resources.
   */
  async shutdown(): Promise<void> {
    // Reject all pending tasks
    for (const [taskId, pending] of this.pendingTasks) {
      pending.reject(new Error("Worker pool shutting down"));
      clearTimeout(pending.timeout);
    }
    this.pendingTasks.clear();

    // Terminate all workers
    await Promise.all(this.workers.map((w) => w.terminate()));
    this.workers = [];
    this.initialized = false;
  }

  /**
   * Get pool statistics.
   */
  getStats(): {
    poolSize: number;
    pendingTasks: number;
    initialized: boolean;
  } {
    return {
      poolSize: this.poolSize,
      pendingTasks: this.pendingTasks.size,
      initialized: this.initialized,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton Instance (Optional)
// ---------------------------------------------------------------------------

let globalPool: SecurityCoachWorkerPool | null = null;

/**
 * Get or create the global worker pool instance.
 */
export function getWorkerPool(): SecurityCoachWorkerPool {
  if (!globalPool) {
    globalPool = new SecurityCoachWorkerPool();
  }
  return globalPool;
}

/**
 * Shutdown the global worker pool.
 */
export async function shutdownWorkerPool(): Promise<void> {
  if (globalPool) {
    await globalPool.shutdown();
    globalPool = null;
  }
}

// ---------------------------------------------------------------------------
// Convenience Functions
// ---------------------------------------------------------------------------

/**
 * Execute pattern matching in a worker thread.
 *
 * Falls back to main thread if worker pool unavailable.
 */
export async function matchThreatsAsync(input: ThreatMatchInput): Promise<ThreatMatch[]> {
  try {
    const pool = getWorkerPool();
    const result = await pool.execute({
      type: "match-threats",
      input,
    });

    if (result.type === "error") {
      throw new Error(result.error);
    }

    if (result.type === "match-threats") {
      return result.matches;
    }

    throw new Error("Unexpected result type");
  } catch (err) {
    // Fallback to main thread
    console.warn(`[worker-pool] Worker execution failed, falling back to main thread:`, err);
    const { matchThreats } = await import("./patterns.js");
    return matchThreats(input);
  }
}

/**
 * Execute batch pattern matching in a worker thread.
 *
 * Useful for processing multiple inputs at once (e.g., backlog).
 */
export async function matchThreatsBatch(
  inputs: ThreatMatchInput[],
): Promise<Array<{ matches: ThreatMatch[]; duration: number }>> {
  try {
    const pool = getWorkerPool();
    const result = await pool.execute({
      type: "batch-match",
      inputs,
    });

    if (result.type === "error") {
      throw new Error(result.error);
    }

    if (result.type === "batch-match") {
      return result.results;
    }

    throw new Error("Unexpected result type");
  } catch (err) {
    // Fallback to main thread
    console.warn(`[worker-pool] Worker batch execution failed, falling back to main thread:`, err);
    const { matchThreats } = await import("./patterns.js");
    return inputs.map((input) => {
      const start = Date.now();
      const matches = matchThreats(input);
      const duration = Date.now() - start;
      return { matches, duration };
    });
  }
}

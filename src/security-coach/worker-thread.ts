// ---------------------------------------------------------------------------
// Security Coach – Worker Thread Entry Point
// ---------------------------------------------------------------------------
// This script runs in a worker thread to offload CPU-intensive pattern
// matching from the main event loop.
//
// WORKER LIFECYCLE:
// 1. Receives task message from main thread
// 2. Executes pattern matching (or other CPU-heavy work)
// 3. Sends result back to main thread
// 4. Repeats until terminated
// ---------------------------------------------------------------------------

import { parentPort } from "node:worker_threads";
import type { WorkerTask, WorkerResult } from "./worker-pool.js";
import { matchThreats } from "./patterns.js";

if (!parentPort) {
  throw new Error("This script must be run as a worker thread");
}

// ---------------------------------------------------------------------------
// Message Handler
// ---------------------------------------------------------------------------

parentPort.on("message", async (msg: { taskId: number; task: WorkerTask }) => {
  const { taskId, task } = msg;
  let result: WorkerResult;

  try {
    switch (task.type) {
      case "match-threats": {
        const start = Date.now();
        const matches = matchThreats(task.input);
        const duration = Date.now() - start;
        result = {
          type: "match-threats",
          matches,
          duration,
        };
        break;
      }

      case "batch-match": {
        const results = task.inputs.map((input) => {
          const start = Date.now();
          const matches = matchThreats(input);
          const duration = Date.now() - start;
          return { matches, duration };
        });
        result = {
          type: "batch-match",
          results,
        };
        break;
      }

      default: {
        const unknownType =
          task && typeof task === "object" && "type" in task
            ? String((task as { type: unknown }).type)
            : "unknown";
        result = {
          type: "error",
          error: `Unknown task type: ${unknownType}`,
        };
      }
    }
  } catch (err) {
    result = {
      type: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Send result back to main thread
  parentPort?.postMessage({ taskId, result });
});

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

// Send ready signal to main thread
parentPort.postMessage({ type: "ready" });

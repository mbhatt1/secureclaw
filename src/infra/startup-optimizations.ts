/**
 * Startup optimizations for resource-constrained environments
 * Handles lazy loading, parallel initialization, and memory monitoring
 */

import { getSystemMemory, isRaspberryPi } from "../config/profiles.js";
import { startHealthMonitoring } from "./pi-health.js";

export interface StartupOptimizations {
  lazyLoadModules: boolean;
  parallelInit: boolean;
  asyncMemory: boolean;
  skipHealthCheck: boolean;
  enablePiMonitoring: boolean;
}

export interface StartupMetrics {
  startTime: number;
  configLoadTime?: number;
  pluginLoadTime?: number;
  channelLoadTime?: number;
  memoryInitTime?: number;
  totalTime?: number;
  peakMemory?: number;
}

/**
 * Detect if running in a resource-constrained environment
 */
export function detectResourceConstraints(): {
  isConstrained: boolean;
  reason?: string;
  memoryMB?: number;
} {
  const systemMem = getSystemMemory();

  if (systemMem && systemMem.total < 2048) {
    return {
      isConstrained: true,
      reason: "Low memory system",
      memoryMB: systemMem.total,
    };
  }

  if (isRaspberryPi()) {
    return {
      isConstrained: true,
      reason: "Raspberry Pi detected",
      memoryMB: systemMem?.total,
    };
  }

  return { isConstrained: false };
}

/**
 * Determine optimal startup strategy based on system resources
 */
export function resolveStartupOptimizations(
  config:
    | Pick<import("../config/config.js").SecureClawConfig, "gateway">
    | {
        gateway?: {
          startup?: {
            skipHealthCheck?: boolean;
            parallelChannels?: boolean;
            asyncMemory?: boolean;
            lazyLoadModules?: boolean;
          };
        };
      },
): StartupOptimizations {
  const constraints = detectResourceConstraints();
  const startupConfig = config.gateway?.startup;

  return {
    // Lazy load heavy modules (Playwright, etc) on constrained systems
    lazyLoadModules: startupConfig?.lazyLoadModules ?? constraints.isConstrained,

    // Parallel channel initialization on capable systems
    parallelInit: startupConfig?.parallelChannels ?? !constraints.isConstrained,

    // Async memory backend loading
    asyncMemory: startupConfig?.asyncMemory ?? constraints.isConstrained,

    // Skip expensive health checks on constrained systems
    skipHealthCheck: startupConfig?.skipHealthCheck ?? false,

    // Enable Pi-specific monitoring if on Raspberry Pi
    enablePiMonitoring: isRaspberryPi(),
  };
}

/**
 * Start Pi health monitoring if enabled
 */
export function startPiHealthMonitoring(options: {
  enabled: boolean;
  logger?: { warn: (msg: string) => void; error: (msg: string) => void };
}): (() => void) | null {
  if (!options.enabled) {
    return null;
  }

  return startHealthMonitoring({
    interval: 60000, // 1 minute
    logger: options.logger,
    onWarning: (warnings) => {
      options.logger?.warn(`[pi-health] System warnings:\n${warnings.join("\n")}`);
    },
    onCritical: (critical) => {
      options.logger?.error(`[pi-health] Critical system issues:\n${critical.join("\n")}`);
    },
  });
}

/**
 * Create startup metrics tracker
 */
export function createStartupMetrics(): {
  metrics: StartupMetrics;
  mark: (phase: keyof StartupMetrics) => void;
  complete: () => StartupMetrics;
} {
  const metrics: StartupMetrics = {
    startTime: Date.now(),
  };

  const mark = (phase: keyof StartupMetrics) => {
    metrics[phase] = Date.now() - metrics.startTime;

    // Track peak memory
    const usage = process.memoryUsage();
    const currentMB = usage.heapUsed / 1024 / 1024;
    if (!metrics.peakMemory || currentMB > metrics.peakMemory) {
      metrics.peakMemory = currentMB;
    }
  };

  const complete = () => {
    metrics.totalTime = Date.now() - metrics.startTime;
    return metrics;
  };

  return { metrics, mark, complete };
}

/**
 * Format startup metrics for logging
 */
export function formatStartupMetrics(metrics: StartupMetrics): string {
  const lines: string[] = [];

  if (metrics.totalTime !== undefined) {
    lines.push(`Total startup time: ${(metrics.totalTime / 1000).toFixed(2)}s`);
  }

  if (metrics.configLoadTime !== undefined) {
    lines.push(`  Config load: ${(metrics.configLoadTime / 1000).toFixed(2)}s`);
  }

  if (metrics.pluginLoadTime !== undefined) {
    lines.push(`  Plugin load: ${(metrics.pluginLoadTime / 1000).toFixed(2)}s`);
  }

  if (metrics.channelLoadTime !== undefined) {
    lines.push(`  Channel load: ${(metrics.channelLoadTime / 1000).toFixed(2)}s`);
  }

  if (metrics.memoryInitTime !== undefined) {
    lines.push(`  Memory init: ${(metrics.memoryInitTime / 1000).toFixed(2)}s`);
  }

  if (metrics.peakMemory !== undefined) {
    lines.push(`Peak memory: ${metrics.peakMemory.toFixed(1)}MB`);
  }

  return lines.join("\n");
}

/**
 * Log startup performance and system info
 */
export function logStartupInfo(options: {
  metrics: StartupMetrics;
  optimizations: StartupOptimizations;
  constraints: ReturnType<typeof detectResourceConstraints>;
  logger: { info: (msg: string) => void };
}): void {
  const { metrics, optimizations, constraints, logger } = options;

  // Log system info
  if (constraints.isConstrained) {
    logger.info(
      `[startup] Running on constrained system: ${constraints.reason}${constraints.memoryMB ? ` (${constraints.memoryMB.toFixed(0)}MB RAM)` : ""}`,
    );
  }

  // Log optimizations
  const enabledOpts: string[] = [];
  if (optimizations.lazyLoadModules) {
    enabledOpts.push("lazy-load");
  }
  if (optimizations.parallelInit) {
    enabledOpts.push("parallel-init");
  }
  if (optimizations.asyncMemory) {
    enabledOpts.push("async-memory");
  }
  if (optimizations.skipHealthCheck) {
    enabledOpts.push("skip-health");
  }
  if (optimizations.enablePiMonitoring) {
    enabledOpts.push("pi-monitoring");
  }

  if (enabledOpts.length > 0) {
    logger.info(`[startup] Optimizations: ${enabledOpts.join(", ")}`);
  }

  // Log performance metrics
  logger.info(`[startup] Performance:\n${formatStartupMetrics(metrics)}`);

  // Warn if startup was slow
  if (metrics.totalTime && metrics.totalTime > 10000) {
    logger.info(
      "[startup] Slow startup detected. Consider using a profile optimized for your hardware.",
    );
  }
}

/**
 * Memory monitoring for startup phase
 */
export function watchStartupMemory(options: {
  warnThresholdMB?: number;
  logger?: { warn: (msg: string) => void };
}): () => void {
  const threshold = options.warnThresholdMB ?? 500; // Default 500MB
  let warningIssued = false;

  const interval = setInterval(() => {
    const usage = process.memoryUsage();
    const heapMB = usage.heapUsed / 1024 / 1024;

    if (!warningIssued && heapMB > threshold) {
      options.logger?.warn(
        `[startup] High memory usage during startup: ${heapMB.toFixed(1)}MB (threshold: ${threshold}MB)`,
      );
      warningIssued = true;
    }
  }, 1000);

  return () => clearInterval(interval);
}

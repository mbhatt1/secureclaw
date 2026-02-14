/**
 * Raspberry Pi health monitoring
 * Monitors CPU temperature, memory pressure, disk space, and power state
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Re-export from profiles for convenience
export { isRaspberryPi } from "../config/profiles.js";

export interface PiHealthMetrics {
  platform: string;
  isRaspberryPi: boolean;
  cpu: {
    temperature?: number;
    throttled?: boolean;
    underVoltage?: boolean;
  };
  memory: {
    total: number;
    available: number;
    used: number;
    percentUsed: number;
    pressure: "none" | "low" | "medium" | "high" | "critical";
  };
  disk: {
    total: number;
    available: number;
    used: number;
    percentUsed: number;
  };
  power?: {
    state: string;
    warnings: string[];
  };
}

export interface PiHealthThresholds {
  cpuTempWarning?: number; // Default: 70°C
  cpuTempCritical?: number; // Default: 80°C
  memoryWarning?: number; // Default: 80%
  memoryCritical?: number; // Default: 90%
  diskWarning?: number; // Default: 80%
  diskCritical?: number; // Default: 90%
}

const DEFAULT_THRESHOLDS: Required<PiHealthThresholds> = {
  cpuTempWarning: 70,
  cpuTempCritical: 80,
  memoryWarning: 80,
  memoryCritical: 90,
  diskWarning: 80,
  diskCritical: 90,
};

/**
 * Get CPU temperature (Pi-specific)
 */
function getCpuTemperature(): number | undefined {
  try {
    const temp = readFileSync("/sys/class/thermal/thermal_zone0/temp", "utf-8").trim();
    return parseInt(temp) / 1000; // Convert millidegrees to degrees
  } catch {
    return undefined;
  }
}

/**
 * Get throttling status (Pi-specific)
 */
function getThrottlingStatus(): { throttled: boolean; underVoltage: boolean } {
  try {
    const result = execSync("vcgencmd get_throttled", { encoding: "utf-8" });
    const match = result.match(/throttled=(0x[0-9a-fA-F]+)/);

    if (match) {
      const value = parseInt(match[1], 16);

      return {
        // Bit 0: Under-voltage detected
        underVoltage: (value & 0x1) !== 0,
        // Bit 1: ARM frequency capped, Bit 2: Currently throttled
        throttled: (value & 0x6) !== 0,
      };
    }
  } catch {
    // vcgencmd not available
  }

  return { throttled: false, underVoltage: false };
}

/**
 * Get memory information
 */
function getMemoryInfo(): {
  total: number;
  available: number;
  used: number;
  percentUsed: number;
} {
  try {
    const meminfo = readFileSync("/proc/meminfo", "utf-8");
    const total = parseInt(meminfo.match(/MemTotal:\s+(\d+)/)?.[1] || "0") / 1024;
    const available = parseInt(meminfo.match(/MemAvailable:\s+(\d+)/)?.[1] || "0") / 1024;
    const used = total - available;
    const percentUsed = total > 0 ? (used / total) * 100 : 0;

    return { total, available, used, percentUsed };
  } catch {
    return { total: 0, available: 0, used: 0, percentUsed: 0 };
  }
}

/**
 * Calculate memory pressure level
 */
function calculateMemoryPressure(percentUsed: number): PiHealthMetrics["memory"]["pressure"] {
  if (percentUsed < 60) {
    return "none";
  }
  if (percentUsed < 75) {
    return "low";
  }
  if (percentUsed < 85) {
    return "medium";
  }
  if (percentUsed < 95) {
    return "high";
  }
  return "critical";
}

/**
 * Get disk space information
 */
function getDiskInfo(): {
  total: number;
  available: number;
  used: number;
  percentUsed: number;
} {
  try {
    const df = execSync("df -BM / | tail -1", { encoding: "utf-8" });
    const parts = df.split(/\s+/);

    if (parts.length >= 5) {
      const total = parseInt(parts[1].replace("M", ""));
      const used = parseInt(parts[2].replace("M", ""));
      const available = parseInt(parts[3].replace("M", ""));
      const percentUsed = total > 0 ? (used / total) * 100 : 0;

      return { total, available, used, percentUsed };
    }
  } catch {
    // df command failed
  }

  return { total: 0, available: 0, used: 0, percentUsed: 0 };
}

/**
 * Get power state and warnings (Pi-specific)
 */
function getPowerState(): { state: string; warnings: string[] } | undefined {
  if (!isRaspberryPi()) {
    return undefined;
  }

  const warnings: string[] = [];
  const throttling = getThrottlingStatus();

  if (throttling.underVoltage) {
    warnings.push("Under-voltage detected - check power supply");
  }

  if (throttling.throttled) {
    warnings.push("CPU throttled - system may be overheating or under-powered");
  }

  const state = warnings.length > 0 ? "warning" : "normal";

  return { state, warnings };
}

/**
 * Get comprehensive health metrics
 */
export function getHealthMetrics(): PiHealthMetrics {
  const isPi = isRaspberryPi();
  const memory = getMemoryInfo();
  const disk = getDiskInfo();

  const metrics: PiHealthMetrics = {
    platform: process.platform,
    isRaspberryPi: isPi,
    cpu: {},
    memory: {
      ...memory,
      pressure: calculateMemoryPressure(memory.percentUsed),
    },
    disk,
  };

  if (isPi) {
    metrics.cpu.temperature = getCpuTemperature();
    const throttling = getThrottlingStatus();
    metrics.cpu.throttled = throttling.throttled;
    metrics.cpu.underVoltage = throttling.underVoltage;
    metrics.power = getPowerState();
  }

  return metrics;
}

/**
 * Check health against thresholds and return warnings
 */
export function checkHealth(thresholds: PiHealthThresholds = {}): {
  ok: boolean;
  warnings: string[];
  critical: string[];
} {
  const config = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const metrics = getHealthMetrics();
  const warnings: string[] = [];
  const critical: string[] = [];

  // Check CPU temperature
  if (metrics.cpu.temperature !== undefined) {
    if (metrics.cpu.temperature >= config.cpuTempCritical) {
      critical.push(`CPU temperature critical: ${metrics.cpu.temperature.toFixed(1)}°C`);
    } else if (metrics.cpu.temperature >= config.cpuTempWarning) {
      warnings.push(`CPU temperature high: ${metrics.cpu.temperature.toFixed(1)}°C`);
    }
  }

  // Check memory
  if (metrics.memory.percentUsed >= config.memoryCritical) {
    critical.push(
      `Memory usage critical: ${metrics.memory.percentUsed.toFixed(1)}% (${metrics.memory.used.toFixed(0)}MB used)`,
    );
  } else if (metrics.memory.percentUsed >= config.memoryWarning) {
    warnings.push(
      `Memory usage high: ${metrics.memory.percentUsed.toFixed(1)}% (${metrics.memory.used.toFixed(0)}MB used)`,
    );
  }

  // Check disk space
  if (metrics.disk.percentUsed >= config.diskCritical) {
    critical.push(
      `Disk space critical: ${metrics.disk.percentUsed.toFixed(1)}% used (${metrics.disk.available.toFixed(0)}MB remaining)`,
    );
  } else if (metrics.disk.percentUsed >= config.diskWarning) {
    warnings.push(
      `Disk space low: ${metrics.disk.percentUsed.toFixed(1)}% used (${metrics.disk.available.toFixed(0)}MB remaining)`,
    );
  }

  // Check power state
  if (metrics.power?.warnings) {
    warnings.push(...metrics.power.warnings);
  }

  // Check throttling
  if (metrics.cpu.throttled) {
    warnings.push("CPU is being throttled");
  }

  return {
    ok: critical.length === 0,
    warnings,
    critical,
  };
}

/**
 * Start periodic health monitoring
 */
export function startHealthMonitoring(options: {
  interval?: number; // Default: 60000 (1 minute)
  thresholds?: PiHealthThresholds;
  onWarning?: (warnings: string[]) => void;
  onCritical?: (critical: string[]) => void;
  logger?: { warn: (msg: string) => void; error: (msg: string) => void };
}): () => void {
  const interval = options.interval ?? 60000;
  const isPi = isRaspberryPi();

  if (!isPi) {
    // Don't monitor if not on Pi
    return () => {};
  }

  const timer = setInterval(() => {
    const health = checkHealth(options.thresholds);

    if (health.critical.length > 0) {
      options.logger?.error(`[pi-health] Critical issues detected:\n${health.critical.join("\n")}`);
      options.onCritical?.(health.critical);
    }

    if (health.warnings.length > 0) {
      options.logger?.warn(`[pi-health] Warnings detected:\n${health.warnings.join("\n")}`);
      options.onWarning?.(health.warnings);
    }
  }, interval);

  // Return cleanup function
  return () => clearInterval(timer);
}

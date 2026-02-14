/**
 * Configuration profile loading for optimized deployments
 * Supports loading pre-configured profiles like Raspberry Pi optimizations
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { SecureClawConfig } from "./types.js";
import { ConfigError } from "../infra/errors.js";
import { parseConfigJson5 } from "./io.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ProfileMetadata {
  name: string;
  description: string;
  target?: string;
  path: string;
}

/**
 * Get list of available profiles
 */
export function getAvailableProfiles(): ProfileMetadata[] {
  const profilesDir = join(__dirname, "profiles");

  if (!existsSync(profilesDir)) {
    return [];
  }

  const profiles: ProfileMetadata[] = [];

  // Raspberry Pi profiles
  const piProfiles = [
    {
      name: "raspberry-pi-4-2gb",
      description: "Raspberry Pi 4 with 2GB RAM - Ultra-lightweight",
      target: "<5s startup, <80MB idle RAM, <1W idle power",
    },
    {
      name: "raspberry-pi-4-4gb",
      description: "Raspberry Pi 4 with 4GB RAM - Balanced",
      target: "<5s startup, <100MB idle RAM, <1W idle power",
    },
    {
      name: "raspberry-pi-4-8gb",
      description: "Raspberry Pi 4 with 8GB RAM - Full features",
      target: "<5s startup, <150MB idle RAM, <1.2W idle power",
    },
    {
      name: "raspberry-pi-5",
      description: "Raspberry Pi 5 - High performance",
      target: "<3s startup, <200MB idle RAM, <2W idle power",
    },
  ];

  for (const profile of piProfiles) {
    const path = join(profilesDir, `${profile.name}.json`);
    if (existsSync(path)) {
      profiles.push({ ...profile, path });
    }
  }

  return profiles;
}

/**
 * Load a configuration profile by name
 */
export function loadProfile(profileName: string): Partial<SecureClawConfig> {
  const profiles = getAvailableProfiles();
  const profile = profiles.find((p) => p.name === profileName);

  if (!profile) {
    const available = profiles.map((p) => p.name);
    throw new ConfigError(`Profile '${profileName}' not found`, {
      configKey: "profile",
      metadata: {
        profileName,
        availableProfiles: available,
      },
    });
  }

  const content = readFileSync(profile.path, "utf-8");
  const result = parseConfigJson5(content);

  if (!result.ok) {
    throw new ConfigError(`Failed to parse profile '${profileName}'`, {
      configKey: "profile",
      metadata: {
        profileName,
        parseError: result.error,
      },
    });
  }

  return result.parsed as Partial<SecureClawConfig>;
}

/**
 * Check if a profile exists
 */
export function hasProfile(profileName: string): boolean {
  return getAvailableProfiles().some((p) => p.name === profileName);
}

/**
 * Get profile from environment variable or CLI flag
 * Priority: --profile flag > SECURECLAW_PROFILE env var
 */
export function detectProfileFromEnv(): string | undefined {
  // Check CLI args for --profile flag
  const profileArg = process.argv.find((arg) => arg.startsWith("--profile="));
  if (profileArg) {
    return profileArg.split("=")[1];
  }

  // Check environment variable
  return process.env.SECURECLAW_PROFILE;
}

/**
 * Check if running on Raspberry Pi
 */
export function isRaspberryPi(): boolean {
  if (process.platform !== "linux" || process.arch !== "arm64") {
    return false;
  }

  try {
    const cpuinfo = readFileSync("/proc/cpuinfo", "utf-8");
    return cpuinfo.includes("BCM") || cpuinfo.includes("Raspberry Pi");
  } catch {
    return false;
  }
}

/**
 * Auto-detect appropriate profile based on system specs
 */
export function autoDetectProfile(): string | undefined {
  // Check if running on Raspberry Pi
  try {
    if (isRaspberryPi()) {
      const cpuinfo = readFileSync("/proc/cpuinfo", "utf-8");

      // Detect Raspberry Pi 5
      if (cpuinfo.includes("BCM2712")) {
        return "raspberry-pi-5";
      }

      // Detect Raspberry Pi 4
      if (cpuinfo.includes("BCM2711")) {
        const meminfo = readFileSync("/proc/meminfo", "utf-8");
        const totalMem = meminfo.match(/MemTotal:\s+(\d+)/);

        if (totalMem) {
          const memMB = parseInt(totalMem[1]) / 1024;

          if (memMB < 3000) {
            return "raspberry-pi-4-2gb";
          } else if (memMB < 6000) {
            return "raspberry-pi-4-4gb";
          } else {
            return "raspberry-pi-4-8gb";
          }
        }
      }
    }
  } catch {
    // Not a Pi or can't detect, that's okay
  }

  return undefined;
}

/**
 * Get system memory information
 */
export function getSystemMemory(): { total: number; available: number } | undefined {
  try {
    if (process.platform === "linux") {
      const meminfo = readFileSync("/proc/meminfo", "utf-8");
      const total = meminfo.match(/MemTotal:\s+(\d+)/)?.[1];
      const available = meminfo.match(/MemAvailable:\s+(\d+)/)?.[1];

      if (total && available) {
        return {
          total: parseInt(total) / 1024, // Convert to MB
          available: parseInt(available) / 1024,
        };
      }
    }
  } catch {
    // Not supported on this platform
  }

  return undefined;
}

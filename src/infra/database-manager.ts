/**
 * Database manager for SecureClaw
 *
 * Manages database connections with support for SQLite (optimized for Raspberry Pi)
 * and PostgreSQL (for production deployments).
 */

import path from "node:path";
import type { DatabaseConfig } from "../config/types.secureclaw.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import {
  createOptimizedSQLite,
  type OptimizedSQLiteAdapter,
  type SQLiteOptimizationConfig,
} from "./sqlite-adapter.js";
import { resolvePreferredSecureClawTmpDir } from "./tmp-secureclaw-dir.js";

const log = createSubsystemLogger("database-manager");

export type DatabaseType = "sqlite" | "postgres";

export type DatabaseManager = {
  type: DatabaseType;
  sqlite?: OptimizedSQLiteAdapter;
  // postgres?: PostgresClient; // Future implementation
  close: () => Promise<void>;
};

/**
 * Resolve database configuration with defaults
 */
function resolveDatabaseConfig(config?: DatabaseConfig): Required<DatabaseConfig> {
  const defaultSqlitePath = path.join(resolvePreferredSecureClawTmpDir(), "secureclaw.db");

  return {
    type: config?.type ?? "sqlite",
    sqlite: {
      path: config?.sqlite?.path ?? defaultSqlitePath,
      walMode: config?.sqlite?.walMode ?? true,
      synchronous: config?.sqlite?.synchronous ?? "NORMAL",
      cacheSizeKB: config?.sqlite?.cacheSizeKB ?? 10000,
    },
    postgres: {
      connectionString: config?.postgres?.connectionString,
      host: config?.postgres?.host ?? "localhost",
      port: config?.postgres?.port ?? 5432,
      database: config?.postgres?.database ?? "secureclaw",
      user: config?.postgres?.user,
      password: config?.postgres?.password,
      poolSize: config?.postgres?.poolSize ?? 10,
    },
  };
}

/**
 * Create a database manager based on configuration
 */
export function createDatabaseManager(config?: DatabaseConfig): DatabaseManager {
  const resolved = resolveDatabaseConfig(config);

  if (resolved.type === "sqlite") {
    log.info("initializing sqlite database", {
      path: resolved.sqlite.path,
      walMode: resolved.sqlite.walMode,
    });

    const sqliteConfig: SQLiteOptimizationConfig = {
      walMode: resolved.sqlite.walMode,
      synchronous: resolved.sqlite.synchronous,
      cacheSizeKB: resolved.sqlite.cacheSizeKB,
      tempStoreMemory: true,
      autoCheckpointIntervalMs: 5 * 60 * 1000, // 5 minutes
      checkpointMode: "PASSIVE",
    };

    const sqlite = createOptimizedSQLite(resolved.sqlite.path ?? "secureclaw.db", sqliteConfig);

    return {
      type: "sqlite",
      sqlite,
      close: async () => {
        await sqlite.close();
      },
    };
  }

  if (resolved.type === "postgres") {
    log.info("initializing postgres database", {
      host: resolved.postgres.host,
      port: resolved.postgres.port,
      database: resolved.postgres.database,
    });

    // Future: implement PostgreSQL support
    throw new Error("PostgreSQL support not yet implemented");
  }

  throw new Error(`Unsupported database type: ${resolved.type}`);
}

/**
 * Get default database type based on profile
 */
export function getDefaultDatabaseType(profile?: string): DatabaseType {
  // Use SQLite for minimal/embedded profiles
  if (profile === "minimal" || profile === "embedded" || profile === "raspberry-pi") {
    return "sqlite";
  }

  // Default to PostgreSQL for production
  return "postgres";
}

/**
 * Check if SQLite is available
 */
export function isSQLiteAvailable(): boolean {
  try {
    require("node:sqlite");
    return true;
  } catch {
    return false;
  }
}

/**
 * Get database metrics
 */
export function getDatabaseMetrics(manager: DatabaseManager): {
  type: DatabaseType;
  sqlite?: {
    queries: number;
    transactions: number;
    walCheckpoints: number;
    cacheHitRate: number;
    walSizeBytes: number | null;
  };
} {
  if (manager.type === "sqlite" && manager.sqlite) {
    const metrics = manager.sqlite.getMetrics();
    const cacheStats = manager.sqlite.getCacheStats();
    const walSize = manager.sqlite.getWalSize();

    return {
      type: "sqlite",
      sqlite: {
        queries: metrics.queries,
        transactions: metrics.transactions,
        walCheckpoints: metrics.walCheckpoints,
        cacheHitRate: cacheStats.hitRate,
        walSizeBytes: walSize,
      },
    };
  }

  return { type: manager.type };
}

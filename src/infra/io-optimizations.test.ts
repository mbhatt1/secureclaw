/**
 * Integration tests for I/O optimizations
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createBufferedLogger } from "./buffered-logger.js";
import { createDatabaseManager } from "./database-manager.js";
import { IOMetrics } from "./io-metrics.js";
import { createOptimizedSQLite } from "./sqlite-adapter.js";

describe("I/O Optimizations", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "secureclaw-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("BufferedFileLogger", () => {
    it("should batch log writes", async () => {
      const logPath = path.join(tempDir, "test.log");
      const logger = createBufferedLogger({
        filePath: logPath,
        maxBufferSize: 5,
        flushIntervalMs: 100,
      });

      // Write multiple entries
      logger.append("line 1");
      logger.append("line 2");
      logger.append("line 3");

      // Should not be written yet
      expect(fs.existsSync(logPath)).toBe(false);

      // Wait for flush
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Now it should be written
      expect(fs.existsSync(logPath)).toBe(true);
      const content = fs.readFileSync(logPath, "utf8");
      expect(content).toContain("line 1");
      expect(content).toContain("line 2");
      expect(content).toContain("line 3");

      const stats = logger.getStats();
      expect(stats.totalWrites).toBeGreaterThan(0);

      await logger.close();
    });

    it("should flush on buffer size limit", async () => {
      const logPath = path.join(tempDir, "test.log");
      const logger = createBufferedLogger({
        filePath: logPath,
        maxBufferSize: 3,
        flushIntervalMs: 10000, // Long interval
      });

      // Write exactly maxBufferSize entries
      logger.append("line 1");
      logger.append("line 2");
      logger.append("line 3");

      // Should flush immediately due to buffer size
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fs.existsSync(logPath)).toBe(true);
      const content = fs.readFileSync(logPath, "utf8");
      expect(content.split("\n").filter((l) => l.trim()).length).toBe(3);

      await logger.close();
    });
  });

  describe("OptimizedSQLiteAdapter", () => {
    it("should create and use optimized database", () => {
      const dbPath = path.join(tempDir, "test.db");
      const db = createOptimizedSQLite(dbPath, {
        walMode: true,
        synchronous: "NORMAL",
        cacheSizeKB: 1000,
      });

      // Create table
      db.exec(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      // Insert data
      const insert = db.prepare("INSERT INTO users (name) VALUES (?)");
      insert.run("Alice");
      insert.run("Bob");

      // Query data
      const select = db.prepare("SELECT * FROM users");
      const users = select.all();

      expect(users).toHaveLength(2);
      expect(users[0]).toMatchObject({ id: 1, name: "Alice" });
      expect(users[1]).toMatchObject({ id: 2, name: "Bob" });

      // Check metrics
      const metrics = db.getMetrics();
      expect(metrics.queries).toBeGreaterThan(0);

      void db.close();
    });

    it("should support transactions", async () => {
      const dbPath = path.join(tempDir, "test.db");
      const db = createOptimizedSQLite(dbPath);

      db.exec("CREATE TABLE items (id INTEGER PRIMARY KEY, value TEXT)");

      await db.transaction(() => {
        const insert = db.prepare("INSERT INTO items (value) VALUES (?)");
        insert.run("item1");
        insert.run("item2");
        insert.run("item3");
      });

      const count = db.prepare("SELECT COUNT(*) as count FROM items").get() as {
        count: number;
      };
      expect(count.count).toBe(3);

      const metrics = db.getMetrics();
      expect(metrics.transactions).toBeGreaterThan(0);

      void db.close();
    });

    it("should batch insert efficiently", async () => {
      const dbPath = path.join(tempDir, "test.db");
      const db = createOptimizedSQLite(dbPath);

      db.exec("CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)");

      const products = [
        { id: 1, name: "Product A", price: 10.99 },
        { id: 2, name: "Product B", price: 20.99 },
        { id: 3, name: "Product C", price: 30.99 },
      ];

      await db.batchInsert(
        "INSERT INTO products (id, name, price) VALUES (?, ?, ?)",
        products,
        (p) => [p.id, p.name, p.price],
      );

      const result = db.prepare("SELECT * FROM products").all();
      expect(result).toHaveLength(3);

      void db.close();
    });
  });

  describe("IOMetrics", () => {
    it("should track disk operations", () => {
      const metrics = new IOMetrics({
        windowMs: 1000,
        autoReport: false,
      });

      metrics.recordDiskWrite(1024);
      metrics.recordDiskWrite(2048);
      metrics.recordDiskRead(512);

      const snapshot = metrics.getSnapshot();
      expect(snapshot.disk.writes).toBe(2);
      expect(snapshot.disk.reads).toBe(1);
      expect(snapshot.disk.writeMB).toBeCloseTo(0.003, 3);

      metrics.close();
    });

    it("should track network operations", () => {
      const metrics = new IOMetrics({
        windowMs: 1000,
        autoReport: false,
      });

      metrics.recordNetworkSent(1024);
      metrics.recordNetworkReceived(2048);

      const snapshot = metrics.getSnapshot();
      expect(snapshot.network.sent).toBe(1);
      expect(snapshot.network.received).toBe(1);
      expect(snapshot.network.totalMB).toBeCloseTo(0.003, 3);

      metrics.close();
    });

    it("should track database operations", () => {
      const metrics = new IOMetrics({
        windowMs: 1000,
        autoReport: false,
      });

      metrics.recordDatabaseQuery();
      metrics.recordDatabaseQuery();
      metrics.recordDatabaseTransaction();

      const snapshot = metrics.getSnapshot();
      expect(snapshot.database.queries).toBe(2);
      expect(snapshot.database.transactions).toBe(1);

      metrics.close();
    });

    it("should calculate cache hit rate", () => {
      const metrics = new IOMetrics({
        windowMs: 1000,
        autoReport: false,
      });

      metrics.recordCacheHit();
      metrics.recordCacheHit();
      metrics.recordCacheHit();
      metrics.recordCacheMiss();

      const snapshot = metrics.getSnapshot();
      expect(snapshot.cache.hits).toBe(3);
      expect(snapshot.cache.misses).toBe(1);
      expect(snapshot.cache.hitRate).toBe(75); // 3/4 = 75%

      metrics.close();
    });

    it("should maintain history", () => {
      const metrics = new IOMetrics({
        windowMs: 100,
        autoReport: false,
      });

      metrics.recordDiskWrite(1024);

      // Trigger window
      metrics.recordDiskWrite(2048);

      const history = metrics.getHistory();
      expect(history.length).toBeGreaterThan(0);

      metrics.close();
    });
  });

  describe("DatabaseManager", () => {
    it("should create SQLite database manager", () => {
      const dbPath = path.join(tempDir, "manager-test.db");
      const manager = createDatabaseManager({
        type: "sqlite",
        sqlite: {
          path: dbPath,
          walMode: true,
        },
      });

      expect(manager.type).toBe("sqlite");
      expect(manager.sqlite).toBeDefined();

      void manager.close();
    });

    it("should provide database metrics", () => {
      const dbPath = path.join(tempDir, "metrics-test.db");
      const manager = createDatabaseManager({
        type: "sqlite",
        sqlite: {
          path: dbPath,
        },
      });

      manager.sqlite?.exec("CREATE TABLE test (id INTEGER)");
      manager.sqlite?.prepare("INSERT INTO test VALUES (?)").run(1);

      const metrics = manager.sqlite?.getMetrics();
      expect(metrics?.queries).toBeGreaterThan(0);

      void manager.close();
    });
  });
});

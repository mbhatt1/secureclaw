// ---------------------------------------------------------------------------
// Security Coach – Rules Test Suite
// ---------------------------------------------------------------------------

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { SecurityCoachRuleStore, type SecurityCoachRule } from "./rules.js";

describe("rules.ts", () => {
  let tempDir: string;
  let store: SecurityCoachRuleStore;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "secureclaw-rules-test-"));
    store = new SecurityCoachRuleStore(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("SecurityCoachRuleStore initialization", () => {
    it("should create a new store", () => {
      expect(store).toBeDefined();
    });

    it("should start with empty rules", () => {
      const rules = store.getAllRules();
      expect(rules).toEqual([]);
    });
  });

  describe("load() and save()", () => {
    it("should load empty rules when file does not exist", async () => {
      await store.load();
      expect(store.getAllRules()).toEqual([]);
    });

    it("should save and load rules", async () => {
      store.addRule({
        patternId: "test-pattern",
        decision: "allow",
        expiresAt: 0,
      });
      await store.save();

      const newStore = new SecurityCoachRuleStore(tempDir);
      await newStore.load();
      const rules = newStore.getAllRules();

      expect(rules.length).toBe(1);
      expect(rules[0].patternId).toBe("test-pattern");
      expect(rules[0].decision).toBe("allow");
    });

    it("should preserve rule metadata", async () => {
      const rule = store.addRule({
        patternId: "test-pattern",
        matchValue: "specific-command",
        decision: "deny",
        expiresAt: Date.now() + 10000,
        note: "Test note",
      });
      await store.save();

      const newStore = new SecurityCoachRuleStore(tempDir);
      await newStore.load();
      const loadedRule = newStore.getAllRules()[0];

      expect(loadedRule.id).toBe(rule.id);
      expect(loadedRule.patternId).toBe("test-pattern");
      expect(loadedRule.matchValue).toBe("specific-command");
      expect(loadedRule.decision).toBe("deny");
      expect(loadedRule.note).toBe("Test note");
    });

    it("should handle corrupt rules file gracefully", async () => {
      const rulesPath = path.join(tempDir, "security-coach-rules.json");
      await fs.writeFile(rulesPath, "{ invalid json");

      const warnings: string[] = [];
      const warningStore = new SecurityCoachRuleStore(tempDir, (msg) => warnings.push(msg));
      await warningStore.load();

      expect(warningStore.getAllRules()).toEqual([]);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain("corrupt");
    });

    it("should backup corrupt rules file", async () => {
      const rulesPath = path.join(tempDir, "security-coach-rules.json");
      await fs.writeFile(rulesPath, "{ invalid json");

      const warningStore = new SecurityCoachRuleStore(tempDir, () => {});
      await warningStore.load();

      const files = await fs.readdir(tempDir);
      const backupFiles = files.filter((f) => f.includes(".corrupt."));
      expect(backupFiles.length).toBe(1);
    });

    it("should create state directory if missing", async () => {
      const newDir = path.join(tempDir, "nested", "dir");
      const newStore = new SecurityCoachRuleStore(newDir);
      newStore.addRule({ patternId: "test", decision: "allow", expiresAt: 0 });
      await newStore.save();

      const stat = await fs.stat(newDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it("should use mode 0o700 for state directory", async () => {
      const newDir = path.join(tempDir, "secure-dir");
      const newStore = new SecurityCoachRuleStore(newDir);
      newStore.addRule({ patternId: "test", decision: "allow", expiresAt: 0 });
      await newStore.save();

      const stat = await fs.stat(newDir);
      // Check that directory has restrictive permissions (Unix-like systems)
      if (process.platform !== "win32") {
        expect(stat.mode & 0o777).toBe(0o700);
      }
    });

    it("should use mode 0o600 for rules file", async () => {
      store.addRule({ patternId: "test", decision: "allow", expiresAt: 0 });
      await store.save();

      const rulesPath = path.join(tempDir, "security-coach-rules.json");
      const stat = await fs.stat(rulesPath);

      if (process.platform !== "win32") {
        expect(stat.mode & 0o777).toBe(0o600);
      }
    });

    it("should handle concurrent save operations", async () => {
      store.addRule({ patternId: "test1", decision: "allow", expiresAt: 0 });
      store.addRule({ patternId: "test2", decision: "deny", expiresAt: 0 });

      // Start multiple saves without waiting
      const saves = [store.save(), store.save(), store.save()];
      await Promise.all(saves);

      const newStore = new SecurityCoachRuleStore(tempDir);
      await newStore.load();
      expect(newStore.getAllRules().length).toBe(2);
    });
  });

  describe("addRule()", () => {
    it("should add a rule", () => {
      const rule = store.addRule({
        patternId: "test-pattern",
        decision: "allow",
        expiresAt: 0,
      });

      expect(rule.id).toBeDefined();
      expect(rule.patternId).toBe("test-pattern");
      expect(rule.decision).toBe("allow");
      expect(rule.expiresAt).toBe(0);
      expect(rule.hitCount).toBe(0);
      expect(rule.lastHitAt).toBe(0);
    });

    it("should set createdAt timestamp", () => {
      const before = Date.now();
      const rule = store.addRule({
        patternId: "test-pattern",
        decision: "allow",
        expiresAt: 0,
      });
      const after = Date.now();

      expect(rule.createdAt).toBeGreaterThanOrEqual(before);
      expect(rule.createdAt).toBeLessThanOrEqual(after);
    });

    it("should generate unique IDs", () => {
      const rule1 = store.addRule({ patternId: "test1", decision: "allow", expiresAt: 0 });
      const rule2 = store.addRule({ patternId: "test2", decision: "deny", expiresAt: 0 });

      expect(rule1.id).not.toBe(rule2.id);
    });

    it("should support optional matchValue", () => {
      const rule = store.addRule({
        patternId: "test-pattern",
        matchValue: "specific-command",
        decision: "allow",
        expiresAt: 0,
      });

      expect(rule.matchValue).toBe("specific-command");
    });

    it("should support optional note", () => {
      const rule = store.addRule({
        patternId: "test-pattern",
        decision: "deny",
        expiresAt: 0,
        note: "User-provided justification",
      });

      expect(rule.note).toBe("User-provided justification");
    });

    it("should allow expiring rules", () => {
      const expiresAt = Date.now() + 3600000; // 1 hour from now
      const rule = store.addRule({
        patternId: "test-pattern",
        decision: "allow",
        expiresAt,
      });

      expect(rule.expiresAt).toBe(expiresAt);
    });
  });

  describe("removeRule()", () => {
    it("should remove a rule by ID", () => {
      const rule = store.addRule({ patternId: "test", decision: "allow", expiresAt: 0 });

      const removed = store.removeRule(rule.id);
      expect(removed).toBe(true);
      expect(store.getAllRules()).toEqual([]);
    });

    it("should return false for non-existent ID", () => {
      const removed = store.removeRule("non-existent-id");
      expect(removed).toBe(false);
    });

    it("should only remove specified rule", () => {
      const rule1 = store.addRule({ patternId: "test1", decision: "allow", expiresAt: 0 });
      const rule2 = store.addRule({ patternId: "test2", decision: "deny", expiresAt: 0 });

      store.removeRule(rule1.id);
      const remaining = store.getAllRules();

      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(rule2.id);
    });
  });

  describe("findRule()", () => {
    it("should find rule by pattern ID", () => {
      store.addRule({ patternId: "test-pattern", decision: "allow", expiresAt: 0 });

      const found = store.findRule("test-pattern");
      expect(found).not.toBeNull();
      expect(found?.patternId).toBe("test-pattern");
    });

    it("should find exact match with matchValue", () => {
      store.addRule({
        patternId: "test-pattern",
        matchValue: "specific-command",
        decision: "allow",
        expiresAt: 0,
      });

      const found = store.findRule("test-pattern", "specific-command");
      expect(found).not.toBeNull();
      expect(found?.matchValue).toBe("specific-command");
    });

    it("should prioritize exact match over pattern-only", () => {
      store.addRule({ patternId: "test-pattern", decision: "allow", expiresAt: 0 });
      store.addRule({
        patternId: "test-pattern",
        matchValue: "specific",
        decision: "deny",
        expiresAt: 0,
      });

      const found = store.findRule("test-pattern", "specific");
      expect(found?.decision).toBe("deny");
      expect(found?.matchValue).toBe("specific");
    });

    it("should fall back to pattern-only rule", () => {
      store.addRule({ patternId: "test-pattern", decision: "allow", expiresAt: 0 });

      const found = store.findRule("test-pattern", "any-value");
      expect(found).not.toBeNull();
      expect(found?.patternId).toBe("test-pattern");
      expect(found?.matchValue).toBeUndefined();
    });

    it("should return null for non-existent pattern", () => {
      const found = store.findRule("non-existent");
      expect(found).toBeNull();
    });

    it("should return expired rules (caller decides handling)", () => {
      const rule = store.addRule({
        patternId: "test-pattern",
        decision: "allow",
        expiresAt: Date.now() - 1000, // Expired
      });

      const found = store.findRule("test-pattern");
      expect(found).not.toBeNull();
      expect(found?.id).toBe(rule.id);
    });
  });

  describe("lookup()", () => {
    it("should return decision for valid rule", () => {
      store.addRule({ patternId: "test-pattern", decision: "allow", expiresAt: 0 });

      const decision = store.lookup("test-pattern");
      expect(decision).toBe("allow");
    });

    it("should return null for non-existent rule", () => {
      const decision = store.lookup("non-existent");
      expect(decision).toBeNull();
    });

    it("should return null for expired rule", () => {
      store.addRule({
        patternId: "test-pattern",
        decision: "allow",
        expiresAt: Date.now() - 1000, // Expired
      });

      const decision = store.lookup("test-pattern");
      expect(decision).toBeNull();
    });

    it("should record hit on matched rule", () => {
      const rule = store.addRule({ patternId: "test-pattern", decision: "allow", expiresAt: 0 });

      store.lookup("test-pattern");

      const updatedRule = store.findRule("test-pattern");
      expect(updatedRule?.hitCount).toBe(1);
      expect(updatedRule?.lastHitAt).toBeGreaterThan(0);
    });

    it("should increment hit count on multiple lookups", () => {
      store.addRule({ patternId: "test-pattern", decision: "allow", expiresAt: 0 });

      store.lookup("test-pattern");
      store.lookup("test-pattern");
      store.lookup("test-pattern");

      const rule = store.findRule("test-pattern");
      expect(rule?.hitCount).toBe(3);
    });

    it("should not record hit for expired rules", () => {
      store.addRule({
        patternId: "test-pattern",
        decision: "allow",
        expiresAt: Date.now() - 1000,
      });

      store.lookup("test-pattern");

      const rule = store.findRule("test-pattern");
      expect(rule?.hitCount).toBe(0);
    });

    it("should match with specific value", () => {
      store.addRule({
        patternId: "test-pattern",
        matchValue: "specific",
        decision: "deny",
        expiresAt: 0,
      });

      const decision = store.lookup("test-pattern", "specific");
      expect(decision).toBe("deny");
    });
  });

  describe("recordHit()", () => {
    it("should increment hit count", () => {
      const rule = store.addRule({ patternId: "test", decision: "allow", expiresAt: 0 });

      store.recordHit(rule.id);

      const updated = store.findRule("test");
      expect(updated?.hitCount).toBe(1);
    });

    it("should update lastHitAt timestamp", () => {
      const rule = store.addRule({ patternId: "test", decision: "allow", expiresAt: 0 });
      const before = Date.now();

      store.recordHit(rule.id);
      const after = Date.now();

      const updated = store.findRule("test");
      expect(updated?.lastHitAt).toBeGreaterThanOrEqual(before);
      expect(updated?.lastHitAt).toBeLessThanOrEqual(after);
    });

    it("should handle non-existent rule ID", () => {
      expect(() => store.recordHit("non-existent")).not.toThrow();
    });
  });

  describe("pruneExpired()", () => {
    it("should remove expired rules", () => {
      store.addRule({
        patternId: "expired",
        decision: "allow",
        expiresAt: Date.now() - 1000,
      });
      store.addRule({ patternId: "valid", decision: "allow", expiresAt: 0 });

      const removed = store.pruneExpired();

      expect(removed).toBe(1);
      expect(store.getAllRules().length).toBe(1);
      expect(store.getAllRules()[0].patternId).toBe("valid");
    });

    it("should return 0 when no rules are expired", () => {
      store.addRule({ patternId: "test", decision: "allow", expiresAt: 0 });

      const removed = store.pruneExpired();
      expect(removed).toBe(0);
    });

    it("should keep rules that expire in the future", () => {
      store.addRule({
        patternId: "future",
        decision: "allow",
        expiresAt: Date.now() + 10000,
      });

      store.pruneExpired();
      expect(store.getAllRules().length).toBe(1);
    });

    it("should handle empty rule store", () => {
      const removed = store.pruneExpired();
      expect(removed).toBe(0);
    });

    it("should remove multiple expired rules", () => {
      store.addRule({ patternId: "exp1", decision: "allow", expiresAt: Date.now() - 1000 });
      store.addRule({ patternId: "exp2", decision: "allow", expiresAt: Date.now() - 2000 });
      store.addRule({ patternId: "exp3", decision: "allow", expiresAt: Date.now() - 3000 });

      const removed = store.pruneExpired();
      expect(removed).toBe(3);
      expect(store.getAllRules()).toEqual([]);
    });
  });

  describe("getAllRules()", () => {
    it("should return all rules", () => {
      store.addRule({ patternId: "test1", decision: "allow", expiresAt: 0 });
      store.addRule({ patternId: "test2", decision: "deny", expiresAt: 0 });

      const rules = store.getAllRules();
      expect(rules.length).toBe(2);
    });

    it("should return a copy of rules array", () => {
      store.addRule({ patternId: "test", decision: "allow", expiresAt: 0 });

      const rules1 = store.getAllRules();
      const rules2 = store.getAllRules();

      expect(rules1).not.toBe(rules2);
      expect(rules1).toEqual(rules2);
    });

    it("should include expired rules", () => {
      store.addRule({
        patternId: "expired",
        decision: "allow",
        expiresAt: Date.now() - 1000,
      });

      const rules = store.getAllRules();
      expect(rules.length).toBe(1);
    });
  });

  describe("getSummary()", () => {
    it("should return summary for empty store", () => {
      const summary = store.getSummary();
      expect(summary).toEqual({
        total: 0,
        allows: 0,
        denies: 0,
        expired: 0,
      });
    });

    it("should count allow and deny rules", () => {
      store.addRule({ patternId: "allow1", decision: "allow", expiresAt: 0 });
      store.addRule({ patternId: "allow2", decision: "allow", expiresAt: 0 });
      store.addRule({ patternId: "deny1", decision: "deny", expiresAt: 0 });

      const summary = store.getSummary();
      expect(summary).toEqual({
        total: 3,
        allows: 2,
        denies: 1,
        expired: 0,
      });
    });

    it("should count expired rules", () => {
      store.addRule({
        patternId: "expired1",
        decision: "allow",
        expiresAt: Date.now() - 1000,
      });
      store.addRule({
        patternId: "expired2",
        decision: "deny",
        expiresAt: Date.now() - 2000,
      });
      store.addRule({ patternId: "valid", decision: "allow", expiresAt: 0 });

      const summary = store.getSummary();
      expect(summary.total).toBe(3);
      expect(summary.expired).toBe(2);
    });

    it("should handle future expiration dates", () => {
      store.addRule({
        patternId: "future",
        decision: "allow",
        expiresAt: Date.now() + 10000,
      });

      const summary = store.getSummary();
      expect(summary.expired).toBe(0);
    });
  });

  describe("Rule validation", () => {
    it("should accept both allow and deny decisions", () => {
      const allow = store.addRule({ patternId: "test1", decision: "allow", expiresAt: 0 });
      const deny = store.addRule({ patternId: "test2", decision: "deny", expiresAt: 0 });

      expect(allow.decision).toBe("allow");
      expect(deny.decision).toBe("deny");
    });

    it("should handle expiresAt = 0 (never expires)", () => {
      store.addRule({ patternId: "test", decision: "allow", expiresAt: 0 });

      // Should still be valid after pruning
      store.pruneExpired();
      expect(store.getAllRules().length).toBe(1);
    });
  });

  describe("Complex scenarios", () => {
    it("should handle multiple rules for same pattern", () => {
      store.addRule({ patternId: "test-pattern", decision: "allow", expiresAt: 0 });
      store.addRule({
        patternId: "test-pattern",
        matchValue: "specific-cmd",
        decision: "deny",
        expiresAt: 0,
      });

      expect(store.lookup("test-pattern")).toBe("allow");
      expect(store.lookup("test-pattern", "specific-cmd")).toBe("deny");
      expect(store.lookup("test-pattern", "other-cmd")).toBe("allow");
    });

    it("should handle rule lifecycle", async () => {
      // Create rule
      const rule = store.addRule({ patternId: "test", decision: "allow", expiresAt: 0 });
      expect(store.getAllRules().length).toBe(1);

      // Use rule
      store.lookup("test");
      store.lookup("test");
      expect(store.findRule("test")?.hitCount).toBe(2);

      // Save and reload
      await store.save();
      const newStore = new SecurityCoachRuleStore(tempDir);
      await newStore.load();
      expect(newStore.findRule("test")?.hitCount).toBe(2);

      // Remove rule
      newStore.removeRule(rule.id);
      expect(newStore.getAllRules().length).toBe(0);
    });

    it("should handle expiration workflow", () => {
      const expiresAt = Date.now() + 100; // Expires in 100ms
      store.addRule({ patternId: "test", decision: "allow", expiresAt });

      // Rule is valid immediately
      expect(store.lookup("test")).toBe("allow");

      // After waiting, rule should expire (simulated)
      const expiredStore = new SecurityCoachRuleStore(tempDir);
      expiredStore.addRule({ patternId: "test", decision: "allow", expiresAt: Date.now() - 1 });
      expect(expiredStore.lookup("test")).toBeNull();
    });
  });

  describe("Atomicity and file safety", () => {
    it("should use atomic write (temp file + rename)", async () => {
      store.addRule({ patternId: "test", decision: "allow", expiresAt: 0 });
      await store.save();

      // Check that temp files are cleaned up
      const files = await fs.readdir(tempDir);
      const tempFiles = files.filter((f) => f.includes(".tmp"));
      expect(tempFiles.length).toBe(0);
    });

    it("should handle save errors gracefully", async () => {
      // Create a store with an invalid path
      const invalidStore = new SecurityCoachRuleStore("/invalid/path/that/does/not/exist/");
      invalidStore.addRule({ patternId: "test", decision: "allow", expiresAt: 0 });

      await expect(invalidStore.save()).rejects.toThrow();
    });
  });
});

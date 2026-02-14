#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Auto-Setup Script for LLM Judge
// ---------------------------------------------------------------------------
// Run: pnpm secureclaw setup-llm-judge
// Or:  node scripts/setup-llm-judge.js
// ---------------------------------------------------------------------------

import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { resolveStateDir } from "../src/config/paths.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║  🛡️  Security Coach - LLM Judge Setup                         ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  console.log("This will configure context-aware threat detection using AI.\n");

  // Step 1: Check if already enabled
  const stateDir = resolveStateDir();
  const configPath = path.join(stateDir, "security-coach-config.json");

  let existingConfig: any = {};
  try {
    const data = await fs.readFile(configPath, "utf-8");
    existingConfig = JSON.parse(data);
  } catch {
    // File doesn't exist yet
  }

  if (existingConfig.llmJudge?.enabled) {
    console.log("✅ LLM Judge is already enabled!\n");
    const reconfigure = await question("Do you want to reconfigure? (y/N): ");
    if (reconfigure.toLowerCase() !== "y") {
      console.log("\n👋 Setup cancelled.");
      rl.close();
      return;
    }
    console.log();
  }

  // Step 2: Choose provider
  console.log("📡 Choose your AI provider:\n");
  console.log("  1) Anthropic Claude (Recommended - Haiku $1-2/mo, Sonnet $13-15/mo)");
  console.log("  2) OpenAI GPT (GPT-4o Mini $1/mo, GPT-4o $10-12/mo)");
  console.log("  3) Skip for now (pattern-only mode)\n");

  const providerChoice = await question("Enter choice (1-3): ");
  console.log();

  if (providerChoice === "3") {
    console.log("✅ LLM Judge will remain disabled. Pattern-only mode.");
    rl.close();
    return;
  }

  // Step 3: Get API key
  let apiKey: string | undefined;
  let provider: "anthropic" | "openai";
  let envVar: string;

  if (providerChoice === "1") {
    provider = "anthropic";
    envVar = "ANTHROPIC_API_KEY";
    console.log("📋 Anthropic API Key Setup\n");
    console.log("Get your API key from: https://console.anthropic.com/settings/keys\n");
  } else {
    provider = "openai";
    envVar = "OPENAI_API_KEY";
    console.log("📋 OpenAI API Key Setup\n");
    console.log("Get your API key from: https://platform.openai.com/api-keys\n");
  }

  // Check environment variable
  apiKey = process.env[envVar];
  if (apiKey) {
    console.log(`✅ Found ${envVar} in environment`);
    const masked = apiKey.slice(0, 8) + "..." + apiKey.slice(-4);
    console.log(`   Key: ${masked}\n`);

    const useExisting = await question("Use this API key? (Y/n): ");
    if (useExisting.toLowerCase() === "n") {
      apiKey = undefined;
    }
    console.log();
  }

  if (!apiKey) {
    console.log(`Please enter your ${provider === "anthropic" ? "Anthropic" : "OpenAI"} API key:`);
    console.log("(It will be saved to ~/.secureclaw/llm-api-keys.json)\n");
    apiKey = await question("API Key: ");
    console.log();

    if (!apiKey || apiKey.length < 10) {
      console.error("❌ Invalid API key. Setup cancelled.");
      rl.close();
      return;
    }
  }

  // Step 4: Choose model
  console.log("🤖 Choose model:\n");

  if (provider === "anthropic") {
    console.log("  1) Claude Haiku 4 (Fast & cheap - $1-2/mo) [Recommended]");
    console.log("  2) Claude Sonnet 4 (Accurate - $13-15/mo)\n");
  } else {
    console.log("  1) GPT-4o Mini (Fast & cheap - $1/mo) [Recommended]");
    console.log("  2) GPT-4o (Accurate - $10-12/mo)\n");
  }

  const modelChoice = await question("Enter choice (1-2): ");
  console.log();

  let model: string;
  if (provider === "anthropic") {
    model = modelChoice === "2" ? "claude-sonnet-4" : "claude-haiku-4";
  } else {
    model = modelChoice === "2" ? "gpt-4o" : "gpt-4o-mini";
  }

  // Step 5: Choose features
  console.log("⚙️  Configuration:\n");

  const confirmPatterns = await question("Use LLM to reduce false positives? (Y/n): ");
  const cacheEnabled = await question("Enable response caching (50% cost reduction)? (Y/n): ");
  console.log();

  // Step 6: Save API key securely
  const apiKeysPath = path.join(stateDir, "llm-api-keys.json");
  const apiKeysData: any = {};

  try {
    const existing = await fs.readFile(apiKeysPath, "utf-8");
    Object.assign(apiKeysData, JSON.parse(existing));
  } catch {
    // File doesn't exist
  }

  apiKeysData[provider] = apiKey;

  await fs.mkdir(stateDir, { recursive: true, mode: 0o700 });
  await fs.writeFile(apiKeysPath, JSON.stringify(apiKeysData, null, 2), { mode: 0o600 });

  console.log(`✅ API key saved securely to ${apiKeysPath}`);
  console.log("   (File permissions: 600 - owner read/write only)\n");

  // Step 7: Update Security Coach config
  const llmConfig = {
    enabled: true,
    provider,
    model,
    fallbackToPatterns: true,
    cacheEnabled: cacheEnabled.toLowerCase() !== "n",
    cacheTTL: 3600000, // 1 hour
    maxLatency: 2000, // 2 seconds
    confidenceThreshold: 75,
    confirmPatternMatches: confirmPatterns.toLowerCase() !== "n",
    useLLMForSeverity: ["medium", "low"],
    maxTokens: 1000,
  };

  const newConfig = {
    ...existingConfig,
    llmJudge: llmConfig,
  };

  await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2) + "\n", { mode: 0o600 });

  console.log(`✅ Configuration saved to ${configPath}\n`);

  // Step 8: Summary
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║  ✅ Setup Complete!                                            ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  console.log("📊 Configuration:");
  console.log(`   Provider: ${provider === "anthropic" ? "Anthropic Claude" : "OpenAI GPT"}`);
  console.log(`   Model: ${model}`);
  console.log(`   Caching: ${llmConfig.cacheEnabled ? "Enabled" : "Disabled"}`);
  console.log(
    `   False Positive Reduction: ${llmConfig.confirmPatternMatches ? "Enabled" : "Disabled"}\n`,
  );

  console.log("💰 Estimated Cost:");
  const baseCost = model.includes("haiku") || model.includes("mini") ? "$1-2" : "$10-15";
  const finalCost = llmConfig.cacheEnabled ? "$1-2" : baseCost;
  console.log(`   ${finalCost}/month per user\n`);

  console.log("🚀 Next Steps:");
  console.log("   1. Restart SecureClaw if it's running");
  console.log("   2. LLM Judge will now automatically protect you from:");
  console.log("      • Novel threats (AWS SSRF, obfuscated commands)");
  console.log("      • Cloud misconfigurations");
  console.log("      • Supply chain attacks");
  console.log("      • Context-aware detection (fewer false positives)\n");

  console.log("🧪 Test it:");
  console.log(
    `   pnpm secureclaw agent --agent main --message "curl http://169.254.169.254/latest/meta-data/"\n`,
  );

  console.log("📖 Documentation: SECURITY-COACH-LLM-JUDGE.md\n");

  rl.close();
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err.message);
  process.exit(1);
});

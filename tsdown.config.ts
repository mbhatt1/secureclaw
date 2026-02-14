import { defineConfig } from "tsdown";

const env = {
  NODE_ENV: "production",
};

// Common optimization settings for all bundles
const optimizations = {
  minify: true,
  treeshake: true,
  splitting: true,
  external: [
    // Heavy optional dependencies - dynamically imported
    "playwright-core",
    "pdfjs-dist",
    "@line/bot-sdk",
    "@whiskeysockets/baileys",
    "@napi-rs/canvas",
    "node-llama-cpp",
  ],
};

export default defineConfig([
  {
    entry: "src/index.ts",
    env,
    fixedExtension: false,
    platform: "node",
    ...optimizations,
  },
  {
    entry: "src/entry.ts",
    env,
    fixedExtension: false,
    platform: "node",
    ...optimizations,
  },
  {
    entry: "src/infra/warning-filter.ts",
    env,
    fixedExtension: false,
    platform: "node",
    ...optimizations,
  },
  {
    entry: "src/plugin-sdk/index.ts",
    outDir: "dist/plugin-sdk",
    env,
    fixedExtension: false,
    platform: "node",
    ...optimizations,
  },
  {
    entry: "src/extensionAPI.ts",
    env,
    fixedExtension: false,
    platform: "node",
    ...optimizations,
  },
  {
    entry: ["src/hooks/bundled/*/handler.ts", "src/hooks/llm-slug-generator.ts"],
    env,
    fixedExtension: false,
    platform: "node",
    ...optimizations,
  },
]);

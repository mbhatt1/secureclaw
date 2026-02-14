import { defineConfig } from "tsdown";

const env = {
  NODE_ENV: "production",
};

// External dependencies that should not be bundled
// These are either peer dependencies or heavy optional features
const external = [
  // Optional peer dependencies (loaded dynamically)
  "sharp",
  "@napi-rs/canvas",
  "playwright-core",
  "pdfjs-dist",
  "@aws-sdk/client-bedrock",
  "@line/bot-sdk",
  "@whiskeysockets/baileys",
  "node-llama-cpp",

  // Heavy runtime dependencies that should be kept external
  "@slack/web-api",
  "@slack/bolt",
  "@buape/carbon",
  "grammy",

  // Node built-ins (already external by default, but explicit for clarity)
  "node:*",
];

export default defineConfig([
  {
    entry: "src/index.ts",
    env,
    fixedExtension: false,
    platform: "node",
    minify: true,
    splitting: true,
    external,
    // Additional esbuild options for better optimization
    esbuildOptions: {
      treeShaking: true,
      legalComments: "none",
      // Keep names for better debugging on Pi
      keepNames: true,
    },
  },
  {
    entry: "src/entry.ts",
    env,
    fixedExtension: false,
    platform: "node",
    minify: true,
    splitting: true,
    external,
    esbuildOptions: {
      treeShaking: true,
      legalComments: "none",
      keepNames: true,
    },
  },
  {
    entry: "src/infra/warning-filter.ts",
    env,
    fixedExtension: false,
    platform: "node",
    minify: true,
    external,
    esbuildOptions: {
      treeShaking: true,
      legalComments: "none",
    },
  },
  {
    entry: "src/plugin-sdk/index.ts",
    outDir: "dist/plugin-sdk",
    env,
    fixedExtension: false,
    platform: "node",
    minify: true,
    external,
    esbuildOptions: {
      treeShaking: true,
      legalComments: "none",
      keepNames: true,
    },
  },
  {
    entry: "src/extensionAPI.ts",
    env,
    fixedExtension: false,
    platform: "node",
    minify: true,
    splitting: true,
    external,
    esbuildOptions: {
      treeShaking: true,
      legalComments: "none",
      keepNames: true,
    },
  },
  {
    entry: ["src/hooks/bundled/*/handler.ts", "src/hooks/llm-slug-generator.ts"],
    env,
    fixedExtension: false,
    platform: "node",
    minify: true,
    splitting: true,
    external,
    esbuildOptions: {
      treeShaking: true,
      legalComments: "none",
      keepNames: true,
    },
  },
]);

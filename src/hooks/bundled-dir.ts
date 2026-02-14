import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveBundledHooksDir(): string | undefined {
  const override = process.env.SECURECLAW_BUNDLED_HOOKS_DIR?.trim();
  if (override) {
    return override;
  }

  // bun --compile: ship a sibling `hooks/bundled/` next to the executable.
  try {
    const execDir = path.dirname(process.execPath);
    const sibling = path.join(execDir, "hooks", "bundled");
    try {
      fs.accessSync(sibling, fs.constants.R_OK);
      return sibling;
    } catch {
      // Sibling not accessible
    }
  } catch {
    // ignore
  }

  // npm: resolve `<packageRoot>/dist/hooks/bundled` relative to this module (compiled hooks).
  // This path works when installed via npm: node_modules/secureclaw/dist/hooks/bundled-dir.js
  try {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const distBundled = path.join(moduleDir, "bundled");
    try {
      fs.accessSync(distBundled, fs.constants.R_OK);
      return distBundled;
    } catch {
      // distBundled not accessible
    }
  } catch {
    // ignore
  }

  // dev: resolve `<packageRoot>/src/hooks/bundled` relative to dist/hooks/bundled-dir.js
  // This path works in dev: dist/hooks/bundled-dir.js -> ../../src/hooks/bundled
  try {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const root = path.resolve(moduleDir, "..", "..");
    const srcBundled = path.join(root, "src", "hooks", "bundled");
    try {
      fs.accessSync(srcBundled, fs.constants.R_OK);
      return srcBundled;
    } catch {
      // srcBundled not accessible
    }
  } catch {
    // ignore
  }

  return undefined;
}

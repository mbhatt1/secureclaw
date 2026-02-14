import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveBundledPluginsDir(): string | undefined {
  const override = process.env.SECURECLAW_BUNDLED_PLUGINS_DIR?.trim();
  if (override) {
    return override;
  }

  // bun --compile: ship a sibling `extensions/` next to the executable.
  try {
    const execDir = path.dirname(process.execPath);
    const sibling = path.join(execDir, "extensions");
    try {
      fs.accessSync(sibling, fs.constants.R_OK);
      return sibling;
    } catch {
      // Sibling not accessible
    }
  } catch {
    // ignore
  }

  // npm/dev: walk up from this module to find `extensions/` at the package root.
  try {
    let cursor = path.dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 6; i += 1) {
      const candidate = path.join(cursor, "extensions");
      try {
        fs.accessSync(candidate, fs.constants.R_OK);
        return candidate;
      } catch {
        // Candidate not accessible, continue search
      }
      const parent = path.dirname(cursor);
      if (parent === cursor) {
        break;
      }
      cursor = parent;
    }
  } catch {
    // ignore
  }

  return undefined;
}

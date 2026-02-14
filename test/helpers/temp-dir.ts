import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * Creates a temporary directory and runs a function with it.
 * Automatically cleans up the directory after the function completes.
 *
 * @param fn - Function to run with the temporary directory path
 * @param prefix - Optional prefix for the temp directory name (default: "secureclaw-test-")
 * @returns The result of the function
 */
export async function withTempDir<T>(
  fn: (dir: string) => Promise<T>,
  prefix = "secureclaw-test-",
): Promise<T> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {
      // Ignore cleanup failures
    });
  }
}

import { lstatSync } from "node:fs";

/** Verify a path is not a symlink. Throws if it is. */
export function assertNotSymlink(filePath: string): void {
  try {
    const stats = lstatSync(filePath);
    if (stats.isSymbolicLink()) {
      throw new Error(`Security: refusing to write to symlink at ${filePath}`);
    }
  } catch (err: any) {
    // ENOENT is fine — file doesn't exist yet
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
}

import fs from "node:fs";
import path from "node:path";
import { resolveSecureClawPackageRoot } from "../infra/secureclaw-root.js";

export async function resolveSecureClawDocsPath(params: {
  workspaceDir?: string;
  argv1?: string;
  cwd?: string;
  moduleUrl?: string;
}): Promise<string | null> {
  const workspaceDir = params.workspaceDir?.trim();
  if (workspaceDir) {
    const workspaceDocs = path.join(workspaceDir, "docs");
    try {
      fs.accessSync(workspaceDocs, fs.constants.R_OK);
      return workspaceDocs;
    } catch {
      // Workspace docs not accessible
    }
  }

  const packageRoot = await resolveSecureClawPackageRoot({
    cwd: params.cwd,
    argv1: params.argv1,
    moduleUrl: params.moduleUrl,
  });
  if (!packageRoot) {
    return null;
  }

  const packageDocs = path.join(packageRoot, "docs");
  try {
    fs.accessSync(packageDocs, fs.constants.R_OK);
    return packageDocs;
  } catch {
    return null;
  }
}

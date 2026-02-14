import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { withTempDir } from "../../test/helpers/temp-dir.js";
import { createSecureClawCodingTools } from "./pi-tools.js";

vi.mock("../plugins/tools.js", () => ({
  getPluginToolMeta: () => undefined,
  resolvePluginTools: () => [],
}));

vi.mock("../security-coach/global.js", () => ({
  isSecurityCoachInitialized: () => true,
  getGlobalSecurityCoachHooks: () => null,
}));

vi.mock("../infra/shell-env.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../infra/shell-env.js")>();
  return { ...mod, getShellPathFromLoginShell: () => null };
});

function getTextContent(result?: { content?: Array<{ type: string; text?: string }> }) {
  const textBlock = result?.content?.find((block) => block.type === "text");
  return textBlock?.text ?? "";
}

describe("workspace path resolution", () => {
  it("reads relative paths against workspaceDir even after cwd changes", async () => {
    await withTempDir(async (workspaceDir) => {
      await withTempDir(async (otherDir) => {
        const testFile = "read.txt";
        const contents = "workspace read ok";
        await fs.writeFile(path.join(workspaceDir, testFile), contents, "utf8");

        const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(otherDir);
        try {
          const tools = createSecureClawCodingTools({ workspaceDir });
          const readTool = tools.find((tool) => tool.name === "read");
          expect(readTool).toBeDefined();

          const result = await readTool?.execute("ws-read", { path: testFile });
          expect(getTextContent(result)).toContain(contents);
        } finally {
          cwdSpy.mockRestore();
        }
      }, "secureclaw-cwd-");
    }, "secureclaw-ws-");
  });

  it("writes relative paths against workspaceDir even after cwd changes", async () => {
    await withTempDir(async (workspaceDir) => {
      await withTempDir(async (otherDir) => {
        const testFile = "write.txt";
        const contents = "workspace write ok";

        const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(otherDir);
        try {
          const tools = createSecureClawCodingTools({ workspaceDir });
          const writeTool = tools.find((tool) => tool.name === "write");
          expect(writeTool).toBeDefined();

          await writeTool?.execute("ws-write", {
            path: testFile,
            content: contents,
          });

          const written = await fs.readFile(path.join(workspaceDir, testFile), "utf8");
          expect(written).toBe(contents);
        } finally {
          cwdSpy.mockRestore();
        }
      }, "secureclaw-cwd-");
    }, "secureclaw-ws-");
  });

  it("edits relative paths against workspaceDir even after cwd changes", async () => {
    await withTempDir(async (workspaceDir) => {
      await withTempDir(async (otherDir) => {
        const testFile = "edit.txt";
        await fs.writeFile(path.join(workspaceDir, testFile), "hello world", "utf8");

        const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(otherDir);
        try {
          const tools = createSecureClawCodingTools({ workspaceDir });
          const editTool = tools.find((tool) => tool.name === "edit");
          expect(editTool).toBeDefined();

          await editTool?.execute("ws-edit", {
            path: testFile,
            oldText: "world",
            newText: "secureclaw",
          });

          const updated = await fs.readFile(path.join(workspaceDir, testFile), "utf8");
          expect(updated).toBe("hello secureclaw");
        } finally {
          cwdSpy.mockRestore();
        }
      }, "secureclaw-cwd-");
    }, "secureclaw-ws-");
  });

  it("defaults exec cwd to workspaceDir when workdir is omitted", async () => {
    await withTempDir(async (workspaceDir) => {
      const tools = createSecureClawCodingTools({ workspaceDir, exec: { host: "gateway" } });
      const execTool = tools.find((tool) => tool.name === "exec");
      expect(execTool).toBeDefined();

      const result = await execTool?.execute("ws-exec", {
        command: "echo ok",
      });
      const cwd =
        result?.details && typeof result.details === "object" && "cwd" in result.details
          ? (result.details as { cwd?: string }).cwd
          : undefined;
      expect(cwd).toBeTruthy();
      const [resolvedOutput, resolvedWorkspace] = await Promise.all([
        fs.realpath(String(cwd)),
        fs.realpath(workspaceDir),
      ]);
      expect(resolvedOutput).toBe(resolvedWorkspace);
    }, "secureclaw-ws-");
  });

  it("lets exec workdir override the workspace default", async () => {
    await withTempDir(async (workspaceDir) => {
      await withTempDir(async (overrideDir) => {
        const tools = createSecureClawCodingTools({ workspaceDir, exec: { host: "gateway" } });
        const execTool = tools.find((tool) => tool.name === "exec");
        expect(execTool).toBeDefined();

        const result = await execTool?.execute("ws-exec-override", {
          command: "echo ok",
          workdir: overrideDir,
        });
        const cwd =
          result?.details && typeof result.details === "object" && "cwd" in result.details
            ? (result.details as { cwd?: string }).cwd
            : undefined;
        expect(cwd).toBeTruthy();
        const [resolvedOutput, resolvedOverride] = await Promise.all([
          fs.realpath(String(cwd)),
          fs.realpath(overrideDir),
        ]);
        expect(resolvedOutput).toBe(resolvedOverride);
      }, "secureclaw-override-");
    }, "secureclaw-ws-");
  });
});

describe("sandboxed workspace paths", () => {
  it("uses sandbox workspace for relative read/write/edit", async () => {
    await withTempDir(async (sandboxDir) => {
      await withTempDir(async (workspaceDir) => {
        const sandbox = {
          enabled: true,
          sessionKey: "sandbox:test",
          workspaceDir: sandboxDir,
          agentWorkspaceDir: workspaceDir,
          workspaceAccess: "rw",
          containerName: "secureclaw-sbx-test",
          containerWorkdir: "/workspace",
          docker: {
            image: "secureclaw-sandbox:bookworm-slim",
            containerPrefix: "secureclaw-sbx-",
            workdir: "/workspace",
            readOnlyRoot: true,
            tmpfs: [],
            network: "none",
            user: "1000:1000",
            capDrop: ["ALL"],
            env: { LANG: "C.UTF-8" },
          },
          tools: { allow: [], deny: [] },
          browserAllowHostControl: false,
        };

        const testFile = "sandbox.txt";
        await fs.writeFile(path.join(sandboxDir, testFile), "sandbox read", "utf8");
        await fs.writeFile(path.join(workspaceDir, testFile), "workspace read", "utf8");

        const tools = createSecureClawCodingTools({ workspaceDir, sandbox });
        const readTool = tools.find((tool) => tool.name === "read");
        const writeTool = tools.find((tool) => tool.name === "write");
        const editTool = tools.find((tool) => tool.name === "edit");

        expect(readTool).toBeDefined();
        expect(writeTool).toBeDefined();
        expect(editTool).toBeDefined();

        const result = await readTool?.execute("sbx-read", { path: testFile });
        expect(getTextContent(result)).toContain("sandbox read");

        await writeTool?.execute("sbx-write", {
          path: "new.txt",
          content: "sandbox write",
        });
        const written = await fs.readFile(path.join(sandboxDir, "new.txt"), "utf8");
        expect(written).toBe("sandbox write");

        await editTool?.execute("sbx-edit", {
          path: "new.txt",
          oldText: "write",
          newText: "edit",
        });
        const edited = await fs.readFile(path.join(sandboxDir, "new.txt"), "utf8");
        expect(edited).toBe("sandbox edit");
      }, "secureclaw-workspace-");
    }, "secureclaw-sandbox-");
  });
});

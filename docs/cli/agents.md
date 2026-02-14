---
summary: "CLI reference for `secureclaw agents` (list/add/delete/set identity)"
read_when:
  - You want multiple isolated agents (workspaces + routing + auth)
title: "agents"
---

# `secureclaw agents`

Manage isolated agents (workspaces + auth + routing).

Related:

- Multi-agent routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)

## Examples

```bash
secureclaw agents list
secureclaw agents add work --workspace ~/.secureclaw/workspace-work
secureclaw agents set-identity --workspace ~/.secureclaw/workspace --from-identity
secureclaw agents set-identity --agent main --avatar avatars/secureclaw.png
secureclaw agents delete work
```

## Identity files

Each agent workspace can include an `IDENTITY.md` at the workspace root:

- Example path: `~/.secureclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` reads from the workspace root (or an explicit `--identity-file`)

Avatar paths resolve relative to the workspace root.

## Set identity

`set-identity` writes fields into `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relative path, http(s) URL, or data URI)

Load from `IDENTITY.md`:

```bash
secureclaw agents set-identity --workspace ~/.secureclaw/workspace --from-identity
```

Override fields explicitly:

```bash
secureclaw agents set-identity --agent main --name "SecureClaw" --emoji "🦞" --avatar avatars/secureclaw.png
```

Config sample:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "SecureClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/secureclaw.png",
        },
      },
    ],
  },
}
```

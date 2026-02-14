---
summary: "CLI reference for `secureclaw config` (get/set/unset config values)"
read_when:
  - You want to read or edit config non-interactively
title: "config"
---

# `secureclaw config`

Config helpers: get/set/unset values by path. Run without a subcommand to open
the configure wizard (same as `secureclaw configure`).

## Examples

```bash
secureclaw config get browser.executablePath
secureclaw config set browser.executablePath "/usr/bin/google-chrome"
secureclaw config set agents.defaults.heartbeat.every "2h"
secureclaw config set agents.list[0].tools.exec.node "node-id-or-name"
secureclaw config unset tools.web.search.apiKey
```

## Paths

Paths use dot or bracket notation:

```bash
secureclaw config get agents.defaults.workspace
secureclaw config get agents.list[0].id
```

Use the agent list index to target a specific agent:

```bash
secureclaw config get agents.list
secureclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values are parsed as JSON5 when possible; otherwise they are treated as strings.
Use `--json` to require JSON5 parsing.

```bash
secureclaw config set agents.defaults.heartbeat.every "0m"
secureclaw config set gateway.port 19001 --json
secureclaw config set channels.whatsapp.groups '["*"]' --json
```

Restart the gateway after edits.

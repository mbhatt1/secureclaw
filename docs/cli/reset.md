---
summary: "CLI reference for `secureclaw reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `secureclaw reset`

Reset local config/state (keeps the CLI installed).

```bash
secureclaw reset
secureclaw reset --dry-run
secureclaw reset --scope config+creds+sessions --yes --non-interactive
```

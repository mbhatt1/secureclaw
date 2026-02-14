---
summary: "CLI reference for `secureclaw voicecall` (voice-call plugin command surface)"
read_when:
  - You use the voice-call plugin and want the CLI entry points
  - You want quick examples for `voicecall call|continue|status|tail|expose`
title: "voicecall"
---

# `secureclaw voicecall`

`voicecall` is a plugin-provided command. It only appears if the voice-call plugin is installed and enabled.

Primary doc:

- Voice-call plugin: [Voice Call](/plugins/voice-call)

## Common commands

```bash
secureclaw voicecall status --call-id <id>
secureclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
secureclaw voicecall continue --call-id <id> --message "Any questions?"
secureclaw voicecall end --call-id <id>
```

## Exposing webhooks (Tailscale)

```bash
secureclaw voicecall expose --mode serve
secureclaw voicecall expose --mode funnel
secureclaw voicecall unexpose
```

Security note: only expose the webhook endpoint to networks you trust. Prefer Tailscale Serve over Funnel when possible.

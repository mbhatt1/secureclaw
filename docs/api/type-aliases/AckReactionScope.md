[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / AckReactionScope

# Type Alias: AckReactionScope

> **AckReactionScope** = `"all"` \| `"direct"` \| `"group-all"` \| `"group-mentions"` \| `"off"` \| `"none"`

Defined in: [channels/ack-reactions.ts:1](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/ack-reactions.ts#L1)

Acknowledgment reaction configuration types.
Used to configure when and how the bot sends "read receipt" reactions.

- AckReactionGateParams: Parameters for determining if ack should be sent
- AckReactionScope: Scope of ack reactions (dm, group, all)
- WhatsAppAckReactionMode: WhatsApp-specific ack reaction behavior

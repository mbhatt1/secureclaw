[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / BLUEBUBBLES_ACTIONS

# Variable: BLUEBUBBLES_ACTIONS

> `const` **BLUEBUBBLES_ACTIONS**: `object`

Defined in: [channels/plugins/bluebubbles-actions.ts:9](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/bluebubbles-actions.ts#L9)

BlueBubbles-specific action names and constants for iMessage integration.
Includes direct message and group-specific actions.

## Type Declaration

### addParticipant

> `readonly` **addParticipant**: `object`

#### addParticipant.gate

> `readonly` **gate**: `"addParticipant"` = `"addParticipant"`

#### addParticipant.groupOnly

> `readonly` **groupOnly**: `true` = `true`

### edit

> `readonly` **edit**: `object`

#### edit.gate

> `readonly` **gate**: `"edit"` = `"edit"`

#### edit.unsupportedOnMacOS26

> `readonly` **unsupportedOnMacOS26**: `true` = `true`

### leaveGroup

> `readonly` **leaveGroup**: `object`

#### leaveGroup.gate

> `readonly` **gate**: `"leaveGroup"` = `"leaveGroup"`

#### leaveGroup.groupOnly

> `readonly` **groupOnly**: `true` = `true`

### react

> `readonly` **react**: `object`

#### react.gate

> `readonly` **gate**: `"reactions"` = `"reactions"`

### removeParticipant

> `readonly` **removeParticipant**: `object`

#### removeParticipant.gate

> `readonly` **gate**: `"removeParticipant"` = `"removeParticipant"`

#### removeParticipant.groupOnly

> `readonly` **groupOnly**: `true` = `true`

### renameGroup

> `readonly` **renameGroup**: `object`

#### renameGroup.gate

> `readonly` **gate**: `"renameGroup"` = `"renameGroup"`

#### renameGroup.groupOnly

> `readonly` **groupOnly**: `true` = `true`

### reply

> `readonly` **reply**: `object`

#### reply.gate

> `readonly` **gate**: `"reply"` = `"reply"`

### sendAttachment

> `readonly` **sendAttachment**: `object`

#### sendAttachment.gate

> `readonly` **gate**: `"sendAttachment"` = `"sendAttachment"`

### sendWithEffect

> `readonly` **sendWithEffect**: `object`

#### sendWithEffect.gate

> `readonly` **gate**: `"sendWithEffect"` = `"sendWithEffect"`

### setGroupIcon

> `readonly` **setGroupIcon**: `object`

#### setGroupIcon.gate

> `readonly` **gate**: `"setGroupIcon"` = `"setGroupIcon"`

#### setGroupIcon.groupOnly

> `readonly` **groupOnly**: `true` = `true`

### unsend

> `readonly` **unsend**: `object`

#### unsend.gate

> `readonly` **gate**: `"unsend"` = `"unsend"`

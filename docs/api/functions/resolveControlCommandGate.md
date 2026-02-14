[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / resolveControlCommandGate

# Function: resolveControlCommandGate()

> **resolveControlCommandGate**(`params`): `object`

Defined in: [channels/command-gating.ts:31](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/command-gating.ts#L31)

Resolves whether control commands are gated for a user.
Used to restrict administrative commands to authorized users.

## Parameters

### params

#### allowTextCommands

`boolean`

#### authorizers

`CommandAuthorizer`[]

#### hasControlCommand

`boolean`

#### modeWhenAccessGroupsOff?

`CommandGatingModeWhenAccessGroupsOff`

#### useAccessGroups

`boolean`

## Returns

`object`

### commandAuthorized

> **commandAuthorized**: `boolean`

### shouldBlock

> **shouldBlock**: `boolean`

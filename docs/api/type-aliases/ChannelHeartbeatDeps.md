[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelHeartbeatDeps

# Type Alias: ChannelHeartbeatDeps

> **ChannelHeartbeatDeps** = `object`

Defined in: [channels/plugins/types.core.ts:69](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L69)

Core channel adapter types and interfaces.
These types define the contract for implementing custom messaging channel integrations.

Key interfaces:

- ChannelPlugin: Main plugin contract for implementing a new messaging channel
- ChannelConfigAdapter: Configuration management for channels
- ChannelMessagingAdapter: Send/receive messages and handle media
- ChannelGatewayAdapter: HTTP endpoint handlers for webhooks
- ChannelAuthAdapter: Authentication flows (OAuth, QR codes, etc.)
- ChannelSecurityAdapter: Access control and security policies

## Properties

### hasActiveWebListener()?

> `optional` **hasActiveWebListener**: () => `boolean`

Defined in: [channels/plugins/types.core.ts:71](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L71)

#### Returns

`boolean`

---

### webAuthExists()?

> `optional` **webAuthExists**: () => `Promise`\<`boolean`\>

Defined in: [channels/plugins/types.core.ts:70](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L70)

#### Returns

`Promise`\<`boolean`\>

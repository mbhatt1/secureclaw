[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelMessageActionAdapter

# Type Alias: ChannelMessageActionAdapter

> **ChannelMessageActionAdapter** = `object`

Defined in: [channels/plugins/types.core.ts:314](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L314)

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

### extractToolSend()?

> `optional` **extractToolSend**: (`params`) => [`ChannelToolSend`](ChannelToolSend.md) \| `null`

Defined in: [channels/plugins/types.core.ts:319](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L319)

#### Parameters

##### params

###### args

`Record`\<`string`, `unknown`\>

#### Returns

[`ChannelToolSend`](ChannelToolSend.md) \| `null`

---

### handleAction()?

> `optional` **handleAction**: (`ctx`) => `Promise`\<`AgentToolResult`\<`unknown`\>\>

Defined in: [channels/plugins/types.core.ts:320](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L320)

#### Parameters

##### ctx

[`ChannelMessageActionContext`](ChannelMessageActionContext.md)

#### Returns

`Promise`\<`AgentToolResult`\<`unknown`\>\>

---

### listActions()?

> `optional` **listActions**: (`params`) => `ChannelMessageActionName`[]

Defined in: [channels/plugins/types.core.ts:315](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L315)

#### Parameters

##### params

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

`ChannelMessageActionName`[]

---

### supportsAction()?

> `optional` **supportsAction**: (`params`) => `boolean`

Defined in: [channels/plugins/types.core.ts:316](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L316)

#### Parameters

##### params

###### action

`ChannelMessageActionName`

#### Returns

`boolean`

---

### supportsButtons()?

> `optional` **supportsButtons**: (`params`) => `boolean`

Defined in: [channels/plugins/types.core.ts:317](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L317)

#### Parameters

##### params

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

`boolean`

---

### supportsCards()?

> `optional` **supportsCards**: (`params`) => `boolean`

Defined in: [channels/plugins/types.core.ts:318](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L318)

#### Parameters

##### params

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

`boolean`

[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelAccountSnapshot

# Type Alias: ChannelAccountSnapshot

> **ChannelAccountSnapshot** = `object`

Defined in: [channels/plugins/types.core.ts:95](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L95)

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

### accountId

> **accountId**: `string`

Defined in: [channels/plugins/types.core.ts:96](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L96)

---

### allowFrom?

> `optional` **allowFrom**: `string`[]

Defined in: [channels/plugins/types.core.ts:123](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L123)

---

### allowUnmentionedGroups?

> `optional` **allowUnmentionedGroups**: `boolean`

Defined in: [channels/plugins/types.core.ts:134](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L134)

---

### application?

> `optional` **application**: `unknown`

Defined in: [channels/plugins/types.core.ts:141](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L141)

---

### appTokenSource?

> `optional` **appTokenSource**: `string`

Defined in: [channels/plugins/types.core.ts:126](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L126)

---

### audience?

> `optional` **audience**: `string`

Defined in: [channels/plugins/types.core.ts:130](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L130)

---

### audienceType?

> `optional` **audienceType**: `string`

Defined in: [channels/plugins/types.core.ts:129](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L129)

---

### audit?

> `optional` **audit**: `unknown`

Defined in: [channels/plugins/types.core.ts:140](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L140)

---

### baseUrl?

> `optional` **baseUrl**: `string`

Defined in: [channels/plugins/types.core.ts:133](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L133)

---

### bot?

> `optional` **bot**: `unknown`

Defined in: [channels/plugins/types.core.ts:142](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L142)

---

### botTokenSource?

> `optional` **botTokenSource**: `string`

Defined in: [channels/plugins/types.core.ts:125](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L125)

---

### channelAccessToken?

> `optional` **channelAccessToken**: `string`

Defined in: [channels/plugins/types.core.ts:145](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L145)

---

### channelSecret?

> `optional` **channelSecret**: `string`

Defined in: [channels/plugins/types.core.ts:146](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L146)

---

### cliPath?

> `optional` **cliPath**: `string` \| `null`

Defined in: [channels/plugins/types.core.ts:135](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L135)

---

### configured?

> `optional` **configured**: `boolean`

Defined in: [channels/plugins/types.core.ts:99](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L99)

---

### connected?

> `optional` **connected**: `boolean`

Defined in: [channels/plugins/types.core.ts:102](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L102)

---

### credentialSource?

> `optional` **credentialSource**: `string`

Defined in: [channels/plugins/types.core.ts:127](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L127)

---

### dbPath?

> `optional` **dbPath**: `string` \| `null`

Defined in: [channels/plugins/types.core.ts:136](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L136)

---

### dmPolicy?

> `optional` **dmPolicy**: `string`

Defined in: [channels/plugins/types.core.ts:122](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L122)

---

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [channels/plugins/types.core.ts:98](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L98)

---

### lastConnectedAt?

> `optional` **lastConnectedAt**: `number` \| `null`

Defined in: [channels/plugins/types.core.ts:104](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L104)

---

### lastDisconnect?

> `optional` **lastDisconnect**: `string` \| \{ `at`: `number`; `error?`: `string`; `loggedOut?`: `boolean`; `status?`: `number`; \} \| `null`

Defined in: [channels/plugins/types.core.ts:105](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L105)

---

### lastError?

> `optional` **lastError**: `string` \| `null`

Defined in: [channels/plugins/types.core.ts:116](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L116)

---

### lastEventAt?

> `optional` **lastEventAt**: `number` \| `null`

Defined in: [channels/plugins/types.core.ts:115](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L115)

---

### lastInboundAt?

> `optional` **lastInboundAt**: `number` \| `null`

Defined in: [channels/plugins/types.core.ts:119](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L119)

---

### lastMessageAt?

> `optional` **lastMessageAt**: `number` \| `null`

Defined in: [channels/plugins/types.core.ts:114](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L114)

---

### lastOutboundAt?

> `optional` **lastOutboundAt**: `number` \| `null`

Defined in: [channels/plugins/types.core.ts:120](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L120)

---

### lastProbeAt?

> `optional` **lastProbeAt**: `number` \| `null`

Defined in: [channels/plugins/types.core.ts:139](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L139)

---

### lastStartAt?

> `optional` **lastStartAt**: `number` \| `null`

Defined in: [channels/plugins/types.core.ts:117](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L117)

---

### lastStopAt?

> `optional` **lastStopAt**: `number` \| `null`

Defined in: [channels/plugins/types.core.ts:118](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L118)

---

### linked?

> `optional` **linked**: `boolean`

Defined in: [channels/plugins/types.core.ts:100](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L100)

---

### mode?

> `optional` **mode**: `string`

Defined in: [channels/plugins/types.core.ts:121](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L121)

---

### name?

> `optional` **name**: `string`

Defined in: [channels/plugins/types.core.ts:97](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L97)

---

### port?

> `optional` **port**: `number` \| `null`

Defined in: [channels/plugins/types.core.ts:137](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L137)

---

### probe?

> `optional` **probe**: `unknown`

Defined in: [channels/plugins/types.core.ts:138](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L138)

---

### profile?

> `optional` **profile**: `unknown`

Defined in: [channels/plugins/types.core.ts:144](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L144)

---

### publicKey?

> `optional` **publicKey**: `string` \| `null`

Defined in: [channels/plugins/types.core.ts:143](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L143)

---

### reconnectAttempts?

> `optional` **reconnectAttempts**: `number`

Defined in: [channels/plugins/types.core.ts:103](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L103)

---

### running?

> `optional` **running**: `boolean`

Defined in: [channels/plugins/types.core.ts:101](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L101)

---

### secretSource?

> `optional` **secretSource**: `string`

Defined in: [channels/plugins/types.core.ts:128](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L128)

---

### tokenSource?

> `optional` **tokenSource**: `string`

Defined in: [channels/plugins/types.core.ts:124](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L124)

---

### webhookPath?

> `optional` **webhookPath**: `string`

Defined in: [channels/plugins/types.core.ts:131](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L131)

---

### webhookUrl?

> `optional` **webhookUrl**: `string`

Defined in: [channels/plugins/types.core.ts:132](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L132)

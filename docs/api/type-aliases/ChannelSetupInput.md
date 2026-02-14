[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelSetupInput

# Type Alias: ChannelSetupInput

> **ChannelSetupInput** = `object`

Defined in: [channels/plugins/types.core.ts:19](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L19)

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

### accessToken?

> `optional` **accessToken**: `string`

Defined in: [channels/plugins/types.core.ts:41](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L41)

---

### appToken?

> `optional` **appToken**: `string`

Defined in: [channels/plugins/types.core.ts:24](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L24)

---

### audience?

> `optional` **audience**: `string`

Defined in: [channels/plugins/types.core.ts:37](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L37)

---

### audienceType?

> `optional` **audienceType**: `string`

Defined in: [channels/plugins/types.core.ts:36](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L36)

---

### authDir?

> `optional` **authDir**: `string`

Defined in: [channels/plugins/types.core.ts:30](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L30)

---

### autoDiscoverChannels?

> `optional` **autoDiscoverChannels**: `boolean`

Defined in: [channels/plugins/types.core.ts:50](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L50)

---

### botToken?

> `optional` **botToken**: `string`

Defined in: [channels/plugins/types.core.ts:23](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L23)

---

### cliPath?

> `optional` **cliPath**: `string`

Defined in: [channels/plugins/types.core.ts:26](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L26)

---

### code?

> `optional` **code**: `string`

Defined in: [channels/plugins/types.core.ts:47](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L47)

---

### dbPath?

> `optional` **dbPath**: `string`

Defined in: [channels/plugins/types.core.ts:27](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L27)

---

### deviceName?

> `optional` **deviceName**: `string`

Defined in: [channels/plugins/types.core.ts:43](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L43)

---

### dmAllowlist?

> `optional` **dmAllowlist**: `string`[]

Defined in: [channels/plugins/types.core.ts:49](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L49)

---

### groupChannels?

> `optional` **groupChannels**: `string`[]

Defined in: [channels/plugins/types.core.ts:48](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L48)

---

### homeserver?

> `optional` **homeserver**: `string`

Defined in: [channels/plugins/types.core.ts:39](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L39)

---

### httpHost?

> `optional` **httpHost**: `string`

Defined in: [channels/plugins/types.core.ts:32](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L32)

---

### httpPort?

> `optional` **httpPort**: `string`

Defined in: [channels/plugins/types.core.ts:33](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L33)

---

### httpUrl?

> `optional` **httpUrl**: `string`

Defined in: [channels/plugins/types.core.ts:31](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L31)

---

### initialSyncLimit?

> `optional` **initialSyncLimit**: `number`

Defined in: [channels/plugins/types.core.ts:44](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L44)

---

### name?

> `optional` **name**: `string`

Defined in: [channels/plugins/types.core.ts:20](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L20)

---

### password?

> `optional` **password**: `string`

Defined in: [channels/plugins/types.core.ts:42](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L42)

---

### region?

> `optional` **region**: `string`

Defined in: [channels/plugins/types.core.ts:29](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L29)

---

### service?

> `optional` **service**: `"imessage"` \| `"sms"` \| `"auto"`

Defined in: [channels/plugins/types.core.ts:28](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L28)

---

### ship?

> `optional` **ship**: `string`

Defined in: [channels/plugins/types.core.ts:45](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L45)

---

### signalNumber?

> `optional` **signalNumber**: `string`

Defined in: [channels/plugins/types.core.ts:25](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L25)

---

### token?

> `optional` **token**: `string`

Defined in: [channels/plugins/types.core.ts:21](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L21)

---

### tokenFile?

> `optional` **tokenFile**: `string`

Defined in: [channels/plugins/types.core.ts:22](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L22)

---

### url?

> `optional` **url**: `string`

Defined in: [channels/plugins/types.core.ts:46](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L46)

---

### useEnv?

> `optional` **useEnv**: `boolean`

Defined in: [channels/plugins/types.core.ts:38](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L38)

---

### userId?

> `optional` **userId**: `string`

Defined in: [channels/plugins/types.core.ts:40](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L40)

---

### webhookPath?

> `optional` **webhookPath**: `string`

Defined in: [channels/plugins/types.core.ts:34](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L34)

---

### webhookUrl?

> `optional` **webhookUrl**: `string`

Defined in: [channels/plugins/types.core.ts:35](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.core.ts#L35)

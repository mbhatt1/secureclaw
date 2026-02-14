[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelConfigAdapter

# Type Alias: ChannelConfigAdapter\<ResolvedAccount\>

> **ChannelConfigAdapter**\<`ResolvedAccount`\> = `object`

Defined in: [channels/plugins/types.adapters.ts:41](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L41)

Core channel adapter types and interfaces.
These types define the contract for implementing custom messaging channel integrations.

Key interfaces:

- ChannelPlugin: Main plugin contract for implementing a new messaging channel
- ChannelConfigAdapter: Configuration management for channels
- ChannelMessagingAdapter: Send/receive messages and handle media
- ChannelGatewayAdapter: HTTP endpoint handlers for webhooks
- ChannelAuthAdapter: Authentication flows (OAuth, QR codes, etc.)
- ChannelSecurityAdapter: Access control and security policies

## Type Parameters

### ResolvedAccount

`ResolvedAccount`

## Properties

### defaultAccountId()?

> `optional` **defaultAccountId**: (`cfg`) => `string`

Defined in: [channels/plugins/types.adapters.ts:44](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L44)

#### Parameters

##### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

`string`

---

### deleteAccount()?

> `optional` **deleteAccount**: (`params`) => [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [channels/plugins/types.adapters.ts:50](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L50)

#### Parameters

##### params

###### accountId

`string`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

[`SecureClawConfig`](SecureClawConfig.md)

---

### describeAccount()?

> `optional` **describeAccount**: (`account`, `cfg`) => [`ChannelAccountSnapshot`](ChannelAccountSnapshot.md)

Defined in: [channels/plugins/types.adapters.ts:55](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L55)

#### Parameters

##### account

`ResolvedAccount`

##### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

[`ChannelAccountSnapshot`](ChannelAccountSnapshot.md)

---

### disabledReason()?

> `optional` **disabledReason**: (`account`, `cfg`) => `string`

Defined in: [channels/plugins/types.adapters.ts:52](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L52)

#### Parameters

##### account

`ResolvedAccount`

##### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

`string`

---

### formatAllowFrom()?

> `optional` **formatAllowFrom**: (`params`) => `string`[]

Defined in: [channels/plugins/types.adapters.ts:60](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L60)

#### Parameters

##### params

###### accountId?

`string` \| `null`

###### allowFrom

(`string` \| `number`)[]

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

`string`[]

---

### isConfigured()?

> `optional` **isConfigured**: (`account`, `cfg`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [channels/plugins/types.adapters.ts:53](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L53)

#### Parameters

##### account

`ResolvedAccount`

##### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

`boolean` \| `Promise`\<`boolean`\>

---

### isEnabled()?

> `optional` **isEnabled**: (`account`, `cfg`) => `boolean`

Defined in: [channels/plugins/types.adapters.ts:51](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L51)

#### Parameters

##### account

`ResolvedAccount`

##### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

`boolean`

---

### listAccountIds()

> **listAccountIds**: (`cfg`) => `string`[]

Defined in: [channels/plugins/types.adapters.ts:42](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L42)

#### Parameters

##### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

`string`[]

---

### resolveAccount()

> **resolveAccount**: (`cfg`, `accountId?`) => `ResolvedAccount`

Defined in: [channels/plugins/types.adapters.ts:43](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L43)

#### Parameters

##### cfg

[`SecureClawConfig`](SecureClawConfig.md)

##### accountId?

`string` | `null`

#### Returns

`ResolvedAccount`

---

### resolveAllowFrom()?

> `optional` **resolveAllowFrom**: (`params`) => `string`[] \| `undefined`

Defined in: [channels/plugins/types.adapters.ts:56](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L56)

#### Parameters

##### params

###### accountId?

`string` \| `null`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

`string`[] \| `undefined`

---

### setAccountEnabled()?

> `optional` **setAccountEnabled**: (`params`) => [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [channels/plugins/types.adapters.ts:45](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L45)

#### Parameters

##### params

###### accountId

`string`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### enabled

`boolean`

#### Returns

[`SecureClawConfig`](SecureClawConfig.md)

---

### unconfiguredReason()?

> `optional` **unconfiguredReason**: (`account`, `cfg`) => `string`

Defined in: [channels/plugins/types.adapters.ts:54](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L54)

#### Parameters

##### account

`ResolvedAccount`

##### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

`string`

[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelGroupAdapter

# Type Alias: ChannelGroupAdapter

> **ChannelGroupAdapter** = `object`

Defined in: [channels/plugins/types.adapters.ts:67](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L67)

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

### resolveGroupIntroHint()?

> `optional` **resolveGroupIntroHint**: (`params`) => `string` \| `undefined`

Defined in: [channels/plugins/types.adapters.ts:69](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L69)

#### Parameters

##### params

[`ChannelGroupContext`](ChannelGroupContext.md)

#### Returns

`string` \| `undefined`

---

### resolveRequireMention()?

> `optional` **resolveRequireMention**: (`params`) => `boolean` \| `undefined`

Defined in: [channels/plugins/types.adapters.ts:68](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L68)

#### Parameters

##### params

[`ChannelGroupContext`](ChannelGroupContext.md)

#### Returns

`boolean` \| `undefined`

---

### resolveToolPolicy()?

> `optional` **resolveToolPolicy**: (`params`) => [`GroupToolPolicyConfig`](GroupToolPolicyConfig.md) \| `undefined`

Defined in: [channels/plugins/types.adapters.ts:70](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.adapters.ts#L70)

#### Parameters

##### params

[`ChannelGroupContext`](ChannelGroupContext.md)

#### Returns

[`GroupToolPolicyConfig`](GroupToolPolicyConfig.md) \| `undefined`

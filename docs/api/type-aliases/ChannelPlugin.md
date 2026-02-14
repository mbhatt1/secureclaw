[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelPlugin

# Type Alias: ChannelPlugin\<ResolvedAccount, Probe, Audit\>

> **ChannelPlugin**\<`ResolvedAccount`, `Probe`, `Audit`\> = `object`

Defined in: [channels/plugins/types.plugin.ts:48](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L48)

ChannelPlugin: Main interface for implementing a messaging channel integration.
ChannelConfigSchema: Configuration schema with UI hints for the channel.

## Type Parameters

### ResolvedAccount

`ResolvedAccount` = `any`

### Probe

`Probe` = `unknown`

### Audit

`Audit` = `unknown`

## Properties

### actions?

> `optional` **actions**: [`ChannelMessageActionAdapter`](ChannelMessageActionAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:80](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L80)

---

### agentPrompt?

> `optional` **agentPrompt**: `ChannelAgentPromptAdapter`

Defined in: [channels/plugins/types.plugin.ts:77](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L77)

---

### agentTools?

> `optional` **agentTools**: [`ChannelAgentToolFactory`](ChannelAgentToolFactory.md) \| [`ChannelAgentTool`](ChannelAgentTool.md)[]

Defined in: [channels/plugins/types.plugin.ts:83](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L83)

---

### auth?

> `optional` **auth**: [`ChannelAuthAdapter`](ChannelAuthAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:71](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L71)

---

### capabilities

> **capabilities**: [`ChannelCapabilities`](ChannelCapabilities.md)

Defined in: [channels/plugins/types.plugin.ts:51](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L51)

---

### commands?

> `optional` **commands**: [`ChannelCommandAdapter`](ChannelCommandAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:73](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L73)

---

### config

> **config**: [`ChannelConfigAdapter`](ChannelConfigAdapter.md)\<`ResolvedAccount`\>

Defined in: [channels/plugins/types.plugin.ts:60](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L60)

---

### configSchema?

> `optional` **configSchema**: [`ChannelConfigSchema`](ChannelConfigSchema.md)

Defined in: [channels/plugins/types.plugin.ts:61](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L61)

---

### defaults?

> `optional` **defaults**: `object`

Defined in: [channels/plugins/types.plugin.ts:52](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L52)

#### queue?

> `optional` **queue**: `object`

##### queue.debounceMs?

> `optional` **debounceMs**: `number`

---

### directory?

> `optional` **directory**: [`ChannelDirectoryAdapter`](ChannelDirectoryAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:78](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L78)

---

### elevated?

> `optional` **elevated**: [`ChannelElevatedAdapter`](ChannelElevatedAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:72](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L72)

---

### gateway?

> `optional` **gateway**: [`ChannelGatewayAdapter`](ChannelGatewayAdapter.md)\<`ResolvedAccount`\>

Defined in: [channels/plugins/types.plugin.ts:70](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L70)

---

### gatewayMethods?

> `optional` **gatewayMethods**: `string`[]

Defined in: [channels/plugins/types.plugin.ts:69](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L69)

---

### groups?

> `optional` **groups**: [`ChannelGroupAdapter`](ChannelGroupAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:65](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L65)

---

### heartbeat?

> `optional` **heartbeat**: [`ChannelHeartbeatAdapter`](ChannelHeartbeatAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:81](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L81)

---

### id

> **id**: [`ChannelId`](ChannelId.md)

Defined in: [channels/plugins/types.plugin.ts:49](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L49)

---

### mentions?

> `optional` **mentions**: [`ChannelMentionAdapter`](ChannelMentionAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:66](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L66)

---

### messaging?

> `optional` **messaging**: [`ChannelMessagingAdapter`](ChannelMessagingAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:76](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L76)

---

### meta

> **meta**: [`ChannelMeta`](ChannelMeta.md)

Defined in: [channels/plugins/types.plugin.ts:50](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L50)

---

### onboarding?

> `optional` **onboarding**: [`ChannelOnboardingAdapter`](ChannelOnboardingAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:59](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L59)

---

### outbound?

> `optional` **outbound**: [`ChannelOutboundAdapter`](ChannelOutboundAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:67](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L67)

---

### pairing?

> `optional` **pairing**: [`ChannelPairingAdapter`](ChannelPairingAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:63](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L63)

---

### reload?

> `optional` **reload**: `object`

Defined in: [channels/plugins/types.plugin.ts:57](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L57)

#### configPrefixes

> **configPrefixes**: `string`[]

#### noopPrefixes?

> `optional` **noopPrefixes**: `string`[]

---

### resolver?

> `optional` **resolver**: [`ChannelResolverAdapter`](ChannelResolverAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:79](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L79)

---

### security?

> `optional` **security**: [`ChannelSecurityAdapter`](ChannelSecurityAdapter.md)\<`ResolvedAccount`\>

Defined in: [channels/plugins/types.plugin.ts:64](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L64)

---

### setup?

> `optional` **setup**: [`ChannelSetupAdapter`](ChannelSetupAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:62](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L62)

---

### status?

> `optional` **status**: [`ChannelStatusAdapter`](ChannelStatusAdapter.md)\<`ResolvedAccount`, `Probe`, `Audit`\>

Defined in: [channels/plugins/types.plugin.ts:68](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L68)

---

### streaming?

> `optional` **streaming**: [`ChannelStreamingAdapter`](ChannelStreamingAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:74](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L74)

---

### threading?

> `optional` **threading**: [`ChannelThreadingAdapter`](ChannelThreadingAdapter.md)

Defined in: [channels/plugins/types.plugin.ts:75](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/types.plugin.ts#L75)

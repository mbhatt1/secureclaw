[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelOnboardingAdapter

# Type Alias: ChannelOnboardingAdapter

> **ChannelOnboardingAdapter** = `object`

Defined in: [channels/plugins/onboarding-types.ts:79](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L79)

## Properties

### channel

> **channel**: [`ChannelId`](ChannelId.md)

Defined in: [channels/plugins/onboarding-types.ts:80](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L80)

---

### configure()

> **configure**: (`ctx`) => `Promise`\<`ChannelOnboardingResult`\>

Defined in: [channels/plugins/onboarding-types.ts:82](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L82)

#### Parameters

##### ctx

`ChannelOnboardingConfigureContext`

#### Returns

`Promise`\<`ChannelOnboardingResult`\>

---

### disable()?

> `optional` **disable**: (`cfg`) => [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [channels/plugins/onboarding-types.ts:85](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L85)

#### Parameters

##### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

[`SecureClawConfig`](SecureClawConfig.md)

---

### dmPolicy?

> `optional` **dmPolicy**: [`ChannelOnboardingDmPolicy`](ChannelOnboardingDmPolicy.md)

Defined in: [channels/plugins/onboarding-types.ts:83](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L83)

---

### getStatus()

> **getStatus**: (`ctx`) => `Promise`\<`ChannelOnboardingStatus`\>

Defined in: [channels/plugins/onboarding-types.ts:81](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L81)

#### Parameters

##### ctx

`ChannelOnboardingStatusContext`

#### Returns

`Promise`\<`ChannelOnboardingStatus`\>

---

### onAccountRecorded()?

> `optional` **onAccountRecorded**: (`accountId`, `options?`) => `void`

Defined in: [channels/plugins/onboarding-types.ts:84](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L84)

#### Parameters

##### accountId

`string`

##### options?

`SetupChannelsOptions`

#### Returns

`void`

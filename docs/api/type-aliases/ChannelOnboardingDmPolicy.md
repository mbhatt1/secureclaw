[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / ChannelOnboardingDmPolicy

# Type Alias: ChannelOnboardingDmPolicy

> **ChannelOnboardingDmPolicy** = `object`

Defined in: [channels/plugins/onboarding-types.ts:65](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L65)

## Properties

### allowFromKey

> **allowFromKey**: `string`

Defined in: [channels/plugins/onboarding-types.ts:69](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L69)

---

### channel

> **channel**: [`ChannelId`](ChannelId.md)

Defined in: [channels/plugins/onboarding-types.ts:67](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L67)

---

### getCurrent()

> **getCurrent**: (`cfg`) => [`DmPolicy`](DmPolicy.md)

Defined in: [channels/plugins/onboarding-types.ts:70](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L70)

#### Parameters

##### cfg

[`SecureClawConfig`](SecureClawConfig.md)

#### Returns

[`DmPolicy`](DmPolicy.md)

---

### label

> **label**: `string`

Defined in: [channels/plugins/onboarding-types.ts:66](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L66)

---

### policyKey

> **policyKey**: `string`

Defined in: [channels/plugins/onboarding-types.ts:68](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L68)

---

### promptAllowFrom()?

> `optional` **promptAllowFrom**: (`params`) => `Promise`\<[`SecureClawConfig`](SecureClawConfig.md)\>

Defined in: [channels/plugins/onboarding-types.ts:72](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L72)

#### Parameters

##### params

###### accountId?

`string`

###### cfg

[`SecureClawConfig`](SecureClawConfig.md)

###### prompter

[`WizardPrompter`](WizardPrompter.md)

#### Returns

`Promise`\<[`SecureClawConfig`](SecureClawConfig.md)\>

---

### setPolicy()

> **setPolicy**: (`cfg`, `policy`) => [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [channels/plugins/onboarding-types.ts:71](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/channels/plugins/onboarding-types.ts#L71)

#### Parameters

##### cfg

[`SecureClawConfig`](SecureClawConfig.md)

##### policy

[`DmPolicy`](DmPolicy.md)

#### Returns

[`SecureClawConfig`](SecureClawConfig.md)

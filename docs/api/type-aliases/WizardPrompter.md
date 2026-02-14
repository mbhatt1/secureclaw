[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / WizardPrompter

# Type Alias: WizardPrompter

> **WizardPrompter** = `object`

Defined in: [wizard/prompts.ts:36](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/wizard/prompts.ts#L36)

WizardPrompter: Interactive CLI prompt interface for onboarding wizards.

## Properties

### confirm()

> **confirm**: (`params`) => `Promise`\<`boolean`\>

Defined in: [wizard/prompts.ts:43](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/wizard/prompts.ts#L43)

#### Parameters

##### params

`WizardConfirmParams`

#### Returns

`Promise`\<`boolean`\>

---

### intro()

> **intro**: (`title`) => `Promise`\<`void`\>

Defined in: [wizard/prompts.ts:37](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/wizard/prompts.ts#L37)

#### Parameters

##### title

`string`

#### Returns

`Promise`\<`void`\>

---

### multiselect()

> **multiselect**: \<`T`\>(`params`) => `Promise`\<`T`[]\>

Defined in: [wizard/prompts.ts:41](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/wizard/prompts.ts#L41)

#### Type Parameters

##### T

`T`

#### Parameters

##### params

`WizardMultiSelectParams`\<`T`\>

#### Returns

`Promise`\<`T`[]\>

---

### note()

> **note**: (`message`, `title?`) => `Promise`\<`void`\>

Defined in: [wizard/prompts.ts:39](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/wizard/prompts.ts#L39)

#### Parameters

##### message

`string`

##### title?

`string`

#### Returns

`Promise`\<`void`\>

---

### outro()

> **outro**: (`message`) => `Promise`\<`void`\>

Defined in: [wizard/prompts.ts:38](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/wizard/prompts.ts#L38)

#### Parameters

##### message

`string`

#### Returns

`Promise`\<`void`\>

---

### progress()

> **progress**: (`label`) => `WizardProgress`

Defined in: [wizard/prompts.ts:44](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/wizard/prompts.ts#L44)

#### Parameters

##### label

`string`

#### Returns

`WizardProgress`

---

### select()

> **select**: \<`T`\>(`params`) => `Promise`\<`T`\>

Defined in: [wizard/prompts.ts:40](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/wizard/prompts.ts#L40)

#### Type Parameters

##### T

`T`

#### Parameters

##### params

`WizardSelectParams`\<`T`\>

#### Returns

`Promise`\<`T`\>

---

### text()

> **text**: (`params`) => `Promise`\<`string`\>

Defined in: [wizard/prompts.ts:42](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/wizard/prompts.ts#L42)

#### Parameters

##### params

`WizardTextParams`

#### Returns

`Promise`\<`string`\>

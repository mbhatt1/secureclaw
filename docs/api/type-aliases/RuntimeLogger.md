[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / RuntimeLogger

# Type Alias: RuntimeLogger

> **RuntimeLogger** = `object`

Defined in: [plugins/runtime/types.ts:171](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L171)

Plugin runtime environment and logging interfaces.
Provides access to configuration, storage, and logging within plugins.

## Properties

### debug()?

> `optional` **debug**: (`message`, `meta?`) => `void`

Defined in: [plugins/runtime/types.ts:172](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L172)

#### Parameters

##### message

`string`

##### meta?

`Record`\<`string`, `unknown`\>

#### Returns

`void`

---

### error()

> **error**: (`message`, `meta?`) => `void`

Defined in: [plugins/runtime/types.ts:175](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L175)

#### Parameters

##### message

`string`

##### meta?

`Record`\<`string`, `unknown`\>

#### Returns

`void`

---

### info()

> **info**: (`message`, `meta?`) => `void`

Defined in: [plugins/runtime/types.ts:173](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L173)

#### Parameters

##### message

`string`

##### meta?

`Record`\<`string`, `unknown`\>

#### Returns

`void`

---

### warn()

> **warn**: (`message`, `meta?`) => `void`

Defined in: [plugins/runtime/types.ts:174](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/runtime/types.ts#L174)

#### Parameters

##### message

`string`

##### meta?

`Record`\<`string`, `unknown`\>

#### Returns

`void`

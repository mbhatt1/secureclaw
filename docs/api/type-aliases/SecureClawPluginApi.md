[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / SecureClawPluginApi

# Type Alias: SecureClawPluginApi

> **SecureClawPluginApi** = `object`

Defined in: [plugins/types.ts:246](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L246)

Core plugin system types.

Key interfaces:

- SecureClawPluginApi: Main plugin API for creating services and tools
- SecureClawPluginService: Service lifecycle management
- AnyAgentTool: Agent tool definition (schema + execute function)
- ProviderAuthContext/Result: OAuth and authentication flows

## Properties

### config

> **config**: [`SecureClawConfig`](SecureClawConfig.md)

Defined in: [plugins/types.ts:252](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L252)

---

### description?

> `optional` **description**: `string`

Defined in: [plugins/types.ts:250](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L250)

---

### id

> **id**: `string`

Defined in: [plugins/types.ts:247](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L247)

---

### logger

> **logger**: `PluginLogger`

Defined in: [plugins/types.ts:255](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L255)

---

### name

> **name**: `string`

Defined in: [plugins/types.ts:248](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L248)

---

### on()

> **on**: \<`K`\>(`hookName`, `handler`, `opts?`) => `void`

Defined in: [plugins/types.ts:280](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L280)

Register a lifecycle hook handler

#### Type Parameters

##### K

`K` _extends_ `PluginHookName`

#### Parameters

##### hookName

`K`

##### handler

`PluginHookHandlerMap`\[`K`\]

##### opts?

###### priority?

`number`

#### Returns

`void`

---

### pluginConfig?

> `optional` **pluginConfig**: `Record`\<`string`, `unknown`\>

Defined in: [plugins/types.ts:253](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L253)

---

### registerChannel()

> **registerChannel**: (`registration`) => `void`

Defined in: [plugins/types.ts:267](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L267)

#### Parameters

##### registration

`SecureClawPluginChannelRegistration` | [`ChannelPlugin`](ChannelPlugin.md)

#### Returns

`void`

---

### registerCli()

> **registerCli**: (`registrar`, `opts?`) => `void`

Defined in: [plugins/types.ts:269](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L269)

#### Parameters

##### registrar

`SecureClawPluginCliRegistrar`

##### opts?

###### commands?

`string`[]

#### Returns

`void`

---

### registerCommand()

> **registerCommand**: (`command`) => `void`

Defined in: [plugins/types.ts:277](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L277)

Register a custom command that bypasses the LLM agent.
Plugin commands are processed before built-in commands and before agent invocation.
Use this for simple state-toggling or status commands that don't need AI reasoning.

#### Parameters

##### command

`SecureClawPluginCommandDefinition`

#### Returns

`void`

---

### registerGatewayMethod()

> **registerGatewayMethod**: (`method`, `handler`) => `void`

Defined in: [plugins/types.ts:268](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L268)

#### Parameters

##### method

`string`

##### handler

[`GatewayRequestHandler`](GatewayRequestHandler.md)

#### Returns

`void`

---

### registerHook()

> **registerHook**: (`events`, `handler`, `opts?`) => `void`

Defined in: [plugins/types.ts:260](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L260)

#### Parameters

##### events

`string` | `string`[]

##### handler

`InternalHookHandler`

##### opts?

`SecureClawPluginHookOptions`

#### Returns

`void`

---

### registerHttpHandler()

> **registerHttpHandler**: (`handler`) => `void`

Defined in: [plugins/types.ts:265](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L265)

#### Parameters

##### handler

`SecureClawPluginHttpHandler`

#### Returns

`void`

---

### registerHttpRoute()

> **registerHttpRoute**: (`params`) => `void`

Defined in: [plugins/types.ts:266](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L266)

#### Parameters

##### params

###### handler

`SecureClawPluginHttpRouteHandler`

###### path

`string`

#### Returns

`void`

---

### registerProvider()

> **registerProvider**: (`provider`) => `void`

Defined in: [plugins/types.ts:271](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L271)

#### Parameters

##### provider

`ProviderPlugin`

#### Returns

`void`

---

### registerService()

> **registerService**: (`service`) => `void`

Defined in: [plugins/types.ts:270](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L270)

#### Parameters

##### service

[`SecureClawPluginService`](SecureClawPluginService.md)

#### Returns

`void`

---

### registerTool()

> **registerTool**: (`tool`, `opts?`) => `void`

Defined in: [plugins/types.ts:256](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L256)

#### Parameters

##### tool

[`AnyAgentTool`](AnyAgentTool.md) | `SecureClawPluginToolFactory`

##### opts?

`SecureClawPluginToolOptions`

#### Returns

`void`

---

### resolvePath()

> **resolvePath**: (`input`) => `string`

Defined in: [plugins/types.ts:278](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L278)

#### Parameters

##### input

`string`

#### Returns

`string`

---

### runtime

> **runtime**: [`PluginRuntime`](PluginRuntime.md)

Defined in: [plugins/types.ts:254](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L254)

---

### source

> **source**: `string`

Defined in: [plugins/types.ts:251](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L251)

---

### version?

> `optional` **version**: `string`

Defined in: [plugins/types.ts:249](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/types.ts#L249)

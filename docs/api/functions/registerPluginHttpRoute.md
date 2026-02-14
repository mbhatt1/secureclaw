[**secureclaw**](../README.md)

---

[secureclaw](../README.md) / registerPluginHttpRoute

# Function: registerPluginHttpRoute()

> **registerPluginHttpRoute**(`params`): () => `void`

Defined in: [plugins/http-registry.ts:11](https://github.com/mbhatt1/secureclaw/blob/53b96d22f2035d8dba86478f7d5a352a687c1a00/src/plugins/http-registry.ts#L11)

Registers HTTP routes for plugin endpoints.
Used to expose custom HTTP handlers from plugins.

## Parameters

### params

#### accountId?

`string`

#### fallbackPath?

`string` \| `null`

#### handler

`PluginHttpRouteHandler`

#### log?

(`message`) => `void`

#### path?

`string` \| `null`

#### pluginId?

`string`

#### registry?

`PluginRegistry`

#### source?

`string`

## Returns

> (): `void`

### Returns

`void`
